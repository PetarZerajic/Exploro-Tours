const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  setTourUserIds,
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const { protect, restrictTo } = require("../controllers/authController");
router
  .route("/")
  .get(protect, getAllReviews)
  .post(protect, restrictTo("user"), setTourUserIds, createReview);
router
  .route("/:id")
  .get(protect, getReview)
  .patch(protect, restrictTo("admin", "user"), updateReview)
  .delete(protect, restrictTo("admin", "user"), deleteReview);

module.exports = router;
