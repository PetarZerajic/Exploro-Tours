const express = require("express");
const router = express.Router();
const {
  getOverview,
  getTour,
  getAccount,
  register,
  login,
  updateUserData,
} = require("../controllers/viewsController");
const { createBookingCheckout } = require("../controllers/bookingController");
const { isLoggedIn, protect } = require("../controllers/authController");

router.get("/", createBookingCheckout, isLoggedIn, getOverview);
router.get("/tour/:slug", isLoggedIn, getTour);
router.get("/register", isLoggedIn, register);
router.get("/login", isLoggedIn, login);
router.get("/me", protect, getAccount);
router.post("/submit-user-data", protect, updateUserData);

module.exports = router;
