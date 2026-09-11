function disableButton() {
  let toggle = document.getElementById("orangepebble-form-toggle");
  let form = document.getElementById("orangepebble-form");
  form.classList.add("hidden");
  toggle.style.pointerEvents = "none";
  toggle.style.background = `color-mix(in oklab,var(--color-on-surface)40%,var(--color-secondary))`;
}

function setProgress(perc_frac) {
  let toggle = document.getElementById("orangepebble-form-toggle");
  toggle.style.background = `conic-gradient(var(--color-secondary) 0deg ${360 * perc_frac}deg, color-mix(in oklab,var(--color-on-surface)40%,var(--color-secondary)) ${360 * perc_frac}deg 360deg)`;
}

function enableButton() {
  let toggle = document.getElementById("orangepebble-form-toggle");
  toggle.style.background = "";
  toggle.style.pointerEvents = "";
}
