// ==UserScript==
// @name        Royal Road Download Button Beta
// @license     MIT
// @namespace   orangepebble
// @match       https://www.royalroad.com/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=royalroad.com
// @version     7.0
// @author      OrangePebble
// @description Adds buttons to download Royal Road chapters
// The following @require is needed for jszip to work with @grant
// @require     data:application/javascript,window.setImmediate%20%3D%20window.setImmediate%20%7C%7C%20((f%2C%20...args)%20%3D%3E%20window.setTimeout(()%20%3D%3E%20f(args)%2C%200))%3B
// @require     https://cdn.jsdelivr.net/npm/jszip@3.10.1
// @require     https://cdn.jsdelivr.net/npm/file-saver@2.0.5
// @require     https://update.greasyfork.org/scripts/498119/1399005/setupCommands.js
// @run-at      document-end
// @grant       GM.registerMenuCommand
// @grant       GM.unregisterMenuCommand
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.getResourceText
// @resource    FICTION_BUTTON_HTML http://localhost:3000/fiction-button
// ==/UserScript==

// INFO: In order to run local files I can use a simple webserver to serve all the files in this folder.
// I can't use "file://" because it is blocked either by Firefox or Violentmonkey.
// I found "https://github.com/vercel/serve" that I can run with just ", serve .".

const FICTION_BUTTON = (() => {
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

  return button_container;
})();

const IS_OLD_UI = document.getElementById("beta-switcher") !== null;

let donate_button = document.querySelector(
  "#chapterHeroData > div:nth-child(5) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)",
);

donate_button.after(FICTION_BUTTON);
