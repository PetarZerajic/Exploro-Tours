const { Tour } = require("../models/tourModel");
const { User } = require("../models/userModel");
const { AppError } = require("../utils/appError");

const getOverview = async (req, res, next) => {
  try {
    const tours = await Tour.find();
    res
      .status(200)
      .render("overview", { tour: "The Forest Hiker", tours: tours });
  } catch (err) {
    next(err);
  }
};

const getTour = async (req, res, next) => {
  // 1) Get the data ,for the request tour(including reviews and guides)

  //2) Build the template
  try {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: "reviews",
      fields: "review rating user",
    });

    if (!tour) {
      return next(new AppError(404, "There is no tour with that name"));
    }

    res.status(200).render("tour", {
      title: `${tour.name} Tour`,
      tour: tour,
    });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    res.status(200).render("register");
  } catch (next) {}
};

const login = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

const getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

const updateUserData = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).render("account", {
      title: "Your accoumt",
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  getOverview,
  getTour,
  getAccount,
  register,
  login,
  updateUserData,
};
