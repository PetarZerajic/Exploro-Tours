const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { User } = require("../models/userModel");
const { AppError } = require("../utils/appError");
const { sendEmail } = require("../utils/email");
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
    }).select("+password"); //+ ovde znaci da biramo polje koje po default nije odabrano u DB.

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError(401, "Incorrect email or password"));
    }

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    //1) Provera da li token postoji
    if (!token) {
      return next(
        new AppError(401, "You are not loged in! Please log in to get access")
      );
    }

    // 2) Verifikacija tokena
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const { id, iat } = decoded;

    // 3) Provera da li korisnik i dalje postoji
    const user = await User.findById(id);

    if (!user) {
      return next(
        new AppError(401, "The user belonging this token does no longer exist!")
      );
    }

    // 4) Provera da li je korisnik promenuo lozinku nakon sto je token izdat
    if (user.changedPasswordAfter(iat)) {
      return next(
        new AppError(401, "User recently changed password! Please log in again")
      );
    }
    req.user = user; //Ovde je bitno da skladistimo korisnika na request je kljucno za sledeci korak da bi radio
    next();
  } catch (err) {
    next(err);
  }
};

const restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin','lead-guide'] ✔   role="user" ✖
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

    //Saljemo NEKRIPTOVAN token u url adresu
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forgot your password,please ignore this email.`;

    try {
      await sendEmail({
        email: req.body.email,
        subject: "Your password reset token (valid for 15 min)",
        message: message,
      });

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
    // 1) Get user based on the token
    //Sifrovati token(originalan token koji je hex dec) i uporediti sa sifrovanim u bazi podataka
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    //Mozemo pronaci korisnika na osnovu tokena i takodje proverimo da li token jos nije istekao
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
    });

    // 2) If token has not expired,and there is user,set the new password
    if (!user) {
      return next(new AppError(400, "Token is invalid or has expired!"));
    }
    user.password = req.body.password; //Na ovaj nacin ce da postavimo nove podatek u BP
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); //U ovom slucaju zelimo validatore tj ne iskljucujemo ih jer zelimo da se sifre potvrde

    // 3) Update changedPasswordAt property for the user
    // user.passwordChangedAt = req.body.passwordChangedAt;

    // 4) Log the user in ,send JWT
    createSendToken(user, 200, res);

    next();
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const { password, passwordCurrent, passwordConfirm } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    // 2) Check if POSTED current password is correct
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
      return next(new AppError(401, "You are current password is wrong"));
    }

    // 3)If so,update password
    // user.findByIdAndUpdate() nece raditi onako kako je predvidjeno (pogledaj model za passwordConfirm)
    user.password = password;
    user.passwordConfirm = passwordConfirm;

    await user.save();
    // 4)Log user in,send JWT

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};
module.exports = {
  register,
  logIn,
  protect,
  restrictTo,
  forgotPasword,
  resetPassword,
  updatePassword,
};
