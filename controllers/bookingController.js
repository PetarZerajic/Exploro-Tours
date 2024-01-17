const { Tour } = require("../models/tourModel");
const { Booking } = require("../models/bookingModel");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getCheckoutSession = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/?tour=${
        req.params.tourId
      }&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tour.name,
              description: tour.summary,
              images: [`${process.env.STRIPE_IMAGES_URL}/${tour.imageCover}`],
            },
            unit_amount: tour.price * 100,
          },
          quantity: 1,
        },
      ],
    });

    res.status(200).json({
      status: "success",
      session,
    });
  } catch (err) {
    next(err);
  }
};

const createBookingCheckout = async (req, res, next) => {
  // Note:This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  try {
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();
    await Booking.create({
      tour,
      user,
      price,
    });

    res.redirect(req.originalUrl.split("?")[0]);
  } catch (err) {
    next(err);
  }
};
module.exports = { getCheckoutSession, createBookingCheckout };
