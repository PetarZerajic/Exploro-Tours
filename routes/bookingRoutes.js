const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");
const { getCheckoutSession } = require("../controllers/bookingController");

router.get("/checkout-seassion/:tourId", protect, getCheckoutSession);

module.exports = router;
