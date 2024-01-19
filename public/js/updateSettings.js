import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.5/+esm";
import { showAlert } from "./alerts.js";

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === "password"
        ? "/api/v1/users/updateMyPassword"
        : "/api/v1/users/updateMe";

    const response = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (response.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully!`);

      const updatedUserData = response.data.data.user;

      const userPhoto = document.querySelector(".form__user-photo");
      const userPhotoNav = document.querySelector(".nav__user-img");

      userPhoto.src = `img/users/${updatedUserData.photo}`;
      userPhotoNav.src = `img/users/${updatedUserData.photo}`;
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
