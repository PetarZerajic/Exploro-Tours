const { Tour } = require("../models/tourModel");
const { User } = require("../models/userModel");
const { Booking } = require("../models/bookingModel");
const { AppError } = require("../utils/appError");

const getOverview = async (req, res, next) => {
  try {
    const tours = await Tour.find();
    res.status(200).render("overview", {
      tour: "The Forest Hiker",
      tours: tours,
    });
  } catch (err) {
    next(err);
  }
};

const getTour = async (req, res, next) => {
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

const getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id });
    const tourIds = bookings.map((item) => item.tour.id);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render("overview", {
      title: "My bookings",
      tours,
    });
  } catch (err) {
    next(err);
  }
};

const register = (req, res, next) => {
  res.status(201).render("register", {
    title: "Create a register account",
  });
};

const login = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
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
      title: "Your account",
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
  getMyBookings,
  register,
  login,
  updateUserData,
};
