import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.5/+esm";
import { showAlert } from "./alerts.js";

const stripe = Stripe(
  "pk_test_51OZ9dlFMKHlrnRVJ46zLvJy16vmq2Hd4BQQpy5t3hVzQeiDWOCQFl40BuEd40VPqRepZ5PeQJFwIiP7H1VB4C2n100HNgOOPxJ"
);

export const bookTour = async (tourId) => {
  try {
    const url = `/api/v1/bookings/checkout-seassion/${tourId}`;
    const session = await axios.get(url);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
