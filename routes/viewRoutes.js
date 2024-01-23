const express = require("express");
const router = express.Router();
const {
  getOverview,
  getTour,
  getAccount,
  getMyBookings,
  register,
  login,
  updateUserData,
} = require("../controllers/viewsController");
const { createBookingCheckout } = require("../controllers/bookingController");
const { isLoggedIn, protect } = require("../controllers/authController");

router.get("/", createBookingCheckout, isLoggedIn, getOverview);
router.get("/tour/:slug", isLoggedIn, getTour);
router.get("/register", register);
router.get("/login", login);
router.get("/me", protect, getAccount);
router.get("/my-bookings", protect, getMyBookings);

router.post("/submit-user-data", protect, updateUserData);

module.exports = router;
