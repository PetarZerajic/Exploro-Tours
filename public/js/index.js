import { register } from "./register.js";
import { logIn } from "./login.js";
import { logout } from "./logout.js";
import { updateSettings } from "./updateSettings.js";
import { bookTour } from "./stripe.js";

const regForm = document.querySelector(".form--register");
const loginForm = document.querySelector(".form--login");
const logoutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookButn = document.getElementById("book-tour");

if (regForm) {
  regForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;

    register(fullname, email, password, passwordConfirm);
  });
}
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    logIn(email, password);
  });
}

if (logoutBtn) logoutBtn.addEventListener("click", logout);

if (userDataForm) {
  userDataForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const photo = document.getElementById("photo").files[0];

    const form = new FormData();
    form.append("name", name);
    form.append("email", email);
    form.append("photo", photo);

    updateSettings(form, "data");
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    document.querySelector(".btn--save-password").textContent = "Updating...";

    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    const data = {
      passwordCurrent,
      password,
      passwordConfirm,
    };

    await updateSettings(data, "password");

    document.querySelector(".btn--save-password").textContent = "Save password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });
}

if (bookButn) {
  bookButn.addEventListener("click", async (event) => {
    event.target.textContent = "Processing...";
    const tourId = event.target.dataset.tourId;
    await bookTour(tourId);
  });
}
