const { Review } = require("../models/reviewModel");
const {
  getAll,
  deleteOne,
  updateOne,
  createOne,
  getOne,
} = require("./handlerFactory");

const getAllReviews = getAll(Review);

const setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

const createReview = createOne(Review);
const deleteReview = deleteOne(Review);
const updateReview = updateOne(Review);
const getReview = getOne(Review);

module.exports = {
  getAllReviews,
  getReview,
  setTourUserIds,
  createReview,
  deleteReview,
  updateReview,
};
