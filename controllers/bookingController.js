const { Tour } = require("../models/tourModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getCheckoutSeassion = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/`,
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
              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
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

module.exports = { getCheckoutSeassion };
