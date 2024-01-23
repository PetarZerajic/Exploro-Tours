import { showAlert } from "./alerts.js";
import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.5/+esm";

export const register = async (fullname, email, password, passwordConfirm) => {
  try {
    const response = await axios({
      method: "POST",
      url: "/api/v1/users/register",
      data: {
        name: fullname,
        email,
        password,
        passwordConfirm,
      },
    });

    if (response.data.status === "success") {
      showAlert("success", "Successfully created an account!");
      setTimeout(() => {
        location.assign("/login");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
