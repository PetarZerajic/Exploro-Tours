const { Tour } = require("../models/tourModel");
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

    console.log(tour);
    if (!tour) {
      return next(new AppError(404, "No tour found with that ID"));
    }
    res.status(200).render("tour", {
      tour: tour,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
module.exports = { getOverview, getTour };
