const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");
const { getCheckoutSeassion } = require("../controllers/bookingController");

router.get("/checkout-seassion/:tourId", protect, getCheckoutSeassion);

module.exports = router;
