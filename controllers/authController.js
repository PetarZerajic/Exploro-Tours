const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { User } = require("../models/userModel");
const { AppError } = require("../utils/appError");
const { Email } = require("../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
const register = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    const url = `${req.protocol}://${req.get("host")}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

const logIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError(400, "Please provide email and password"));
    }
    const user = await User.findOne({
      email: email,
    }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError(401, "Incorrect email or password"));
    }

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};
const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const user = await User.findById(decoded.id);
      if (!user) {
        return next();
      }

      if (user.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //  login template will get access
      res.locals.user = user;
      return next();
    } catch (err) {
      return next(err);
    }
  }
  next();
};

const logout = (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  };

  res.cookie("jwt", "loggedout", cookieOptions);

  res.status(200).json({
    status: "success",
  });
};

const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const { id, iat } = decoded;

    const currentUser = await User.findById(id);

    if (!currentUser) {
      return next(
        new AppError(401, "The user belonging this token does no longer exist!")
      );
    }

    if (currentUser.changedPasswordAfter(iat)) {
      return next(
        new AppError(401, "User recently changed password! Please log in again")
      );
    }
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, "You do not have a premission to perfom this action")
      );
    }
    next();
  };

const forgotPasword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(
        new AppError(404, "There is no user with that email adress.")
      );
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/resetPassword/${resetToken}`;

      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });

      next();
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          500,
          "There was an error sending the email.Try again later"
        )
      );
    }
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return next(new AppError(400, "Token is invalid or has expired!"));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);

    next();
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { password, passwordCurrent, passwordConfirm } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    if (!(await user.correctPassword(passwordCurrent, user.password))) {
      return next(new AppError(401, "You are current password is wrong"));
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;

    await user.save();

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  logIn,
  isLoggedIn,
  logout,
  protect,
  restrictTo,
  forgotPasword,
  resetPassword,
  updatePassword,
};
