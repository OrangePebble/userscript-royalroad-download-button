function addFictionButton() {
  const template = document.createElement("template");
  template.innerHTML = GM.getResourceText("FICTION_BUTTON_HTML");
  const button_container = template.content.firstElementChild;
  const toggle = button_container.querySelector("#orangepebble-form-toggle");
  const form = button_container.querySelector("#orangepebble-form");

  const positionForm = () => {
    if (form.classList.contains("hidden")) return;
    const toggle_rect = toggle.getBoundingClientRect();
    const form_rect = form.getBoundingClientRect();
    const left = Math.min(
      toggle_rect.left,
      window.innerWidth - form_rect.width - 8,
    );
    form.style.top = `${toggle_rect.bottom + 7}px`;
    form.style.left = `${left}px`;
  };

  toggle.addEventListener("click", () => {
    positionForm();
    form.classList.toggle("hidden");
  });
  window.addEventListener("resize", positionForm);
  window.addEventListener("scroll", positionForm, true);
  document.addEventListener("click", (event) => {
    if (
      !form.classList.contains("hidden") &&
      !button_container.contains(event.target)
    ) {
      form.classList.add("hidden");
    }
  });

  let donate_button = document.querySelector(
    "#chapterHeroData > div:nth-child(5) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)",
  );

  donate_button.after(button_container);
}
