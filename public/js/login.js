import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.5/+esm";
import { showAlert } from "./alerts.js";

export const logIn = async (email, password) => {
  try {
    const response = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (response.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
