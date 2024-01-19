import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.5/+esm";
import { showAlert } from "./alerts.js";

export const logout = async () => {
  try {
    const response = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });

    if (response.data.status === "success") location.reload(true);
  } catch (err) {
    showAlert("error", "Error logging out! Try again");
  }
};
