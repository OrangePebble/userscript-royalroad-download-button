/**
 * Adds the download button to the fiction page.
 * @param {{title: string, url: string}[]} [chapter_list]
 */
function addFictionButton(chapter_list) {
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
    form.classList.toggle("hidden");
    positionForm();
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

  let start_select = document.getElementById(
    "orangepebble-start-chapter-select",
  );
  let end_select = document.getElementById("orangepebble-end-chapter-select");
  for (const [index, { title }] of chapter_list.entries()) {
    const option = document.createElement("option");
    option.value = index;
    option.innerText = title;
    start_select.append(option);
    end_select.append(option.cloneNode(true));
    start_select.firstChild.setAttribute("selected", "selected");
    end_select.lastChild.setAttribute("selected", "selected");
  }
}
