export const hideAlerts = () => {
  const element = document.querySelector(".alert");

  if (element) element.remove();
};

export const showAlert = (type, msg) => {
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);

  setTimeout(() => {
    hideAlerts();
  }, 4000);
};
