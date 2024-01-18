const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const {
  getCheckoutSession,
  getAllBokings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");

router
  .route("/")
  .get(protect, restrictTo("admin", "lead-guide"), getAllBokings)
  .post(protect, restrictTo("admin", "lead-guide"), createBooking);

router.get("/checkout-seassion/:tourId", protect, getCheckoutSession);

router
  .route("/:id")
  .get(protect, restrictTo("admin", "lead-guide"), getBooking)
  .patch(protect, restrictTo("admin", "lead-guide"), updateBooking)
  .delete(protect, restrictTo("admin", "lead-guide"), deleteBooking);

module.exports = router;
