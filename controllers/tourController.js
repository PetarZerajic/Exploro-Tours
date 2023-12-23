const { Tour } = require("../models/tourModel");
const { AppError } = require("../utils/appError");
const {
  getAll,
  deleteOne,
  updateOne,
  createOne,
  getOne,
} = require("./handlerFactory");

const aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = " -ratingsAverage, price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

const getAllTours = getAll(Tour);

const getTour = getOne(Tour, { path: "reviews" });

const createTour = createOne(Tour);

const updateTour = updateOne(Tour);

const deleteTour = deleteOne(Tour);

//Agregacija
const getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: {
          ratingsAverage: { $gte: 4.5 },
        },
      },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          numTours: { $sum: 1 },
          numRating: { $sum: "$ratingsQuantity" },
          avgRating: {
            $avg: "$ratingsAverage",
          },
          avgPrice: {
            $avg: "$price",
          },
          minPirce: {
            $min: "$price",
          },
          maxPrice: {
            $max: "$price",
          },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);
    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (err) {
    next(err);
  }
};

//Agregacija
//Predstavlja najprometniju turu
const getMonthlyPlan = async (req, res, next) => {
  try {
    const year = +req.params.year; //2022
    const plan = await Tour.aggregate([
      { $unwind: "$startDates" },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}/01-01`),
            $lte: new Date(`${year}/12/31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numToursStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: {
          month: "$_id",
        },
      },
      { $project: { _id: false } },
      {
        $sort: { numToursStarts: -1 },
      },
    ]);
    res.status(200).json({
      status: "success",
      data: {
        plan,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getToursWithin = async (req, res, next) => {
  // 34.072061, -118.212609

  try {
    const { distance, latlng, unit } = req.params;
    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
      next(
        new AppError(
          400,
          "Please proivde  latitude and longitude in format lat,lng"
        )
      );
    }
    const tours = await Tour.find({
      startLocation: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        },
      },
    });
    res.status(200).json({
      status: "success",
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const multiplier = unit === "mi" ? 0.000621371192 : 0.001;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
      next(
        new AppError(
          400,
          "Please proivde  latitude and longitude in format lat,lng"
        )
      );
    }

    const distances = await Tour.aggregate([
      {
        // Ispisuje dokumente u redosledu od najbližeg prema najdalje od određene tačke
        $geoNear: {
          near: {
            //Tacka za pronalazenje najblizeg dokumenta
            type: "Point",
            coordinates: [+lng, +lat],
          },
          distanceField: "distance",
          distanceMultiplier: multiplier, //Zelimo km ili milje
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
      {
        $sort: {
          distance: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        distances,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTours,
  aliasTopTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
};
