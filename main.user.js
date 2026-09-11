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
// @require     http://localhost:3000/add-fiction-button.js
// @require     http://localhost:3000/get-chapter-list.js
// ==/UserScript==

// INFO: In order to run local files I can use a simple webserver to serve all the files in this folder.
// I can't use "file://" because it is blocked either by Firefox or Violentmonkey.
// I found "https://github.com/vercel/serve" that I can run with just ", serve .".

const FICTION_REGEX = new RegExp(
  /^https:\/\/www.royalroad.com\/fiction\/\d+\/[^\/]+\/?[^\/]*$/,
);
const CHAPTER_REGEX = new RegExp(
  /^https:\/\/www.royalroad.com\/fiction\/\d+\/[^\/]+\/chapter\/\d+\/[^\/]+\/?[^\/]*$/,
);
// Not sure if this is the correct name for it, but it's an exception I found in
// https://www.royalroad.com/fiction/chapter/1671376?fid=52639&fslug=edge-cases-complete
const CORRUPTED_CHAPTER_REGEX = new RegExp(
  /^https:\/\/www.royalroad.com\/fiction\/chapter\/\d+\/?[^\/]*$/,
);
const IS_OLD_UI = document.getElementById("beta-switcher") !== null;

const PARSER = new DOMParser();

/**
 * @type {{title: string, url: string}[]}
 */
let chapter_list;

(async () => {
  if (!IS_OLD_UI) {
    if (FICTION_REGEX.test(window.location.href)) {
      addFictionButton((cl) => {
        chapter_list = cl;
      });
      document
        .getElementById("orangepebble-confirm-download-button")
        .addEventListener("click", () => {
          let step = 360 / chapter_list.length;
          let i = 0;
          let interval = setInterval(() => {
            i++;
            let toggle = document.getElementById("orangepebble-form-toggle");
            let form = document.getElementById("orangepebble-form");
            form.classList.add("hidden");
            toggle.style.pointerEvents = "none";
            toggle.style.background = `conic-gradient(var(--color-secondary) 0deg ${step * i}deg, color-mix(in oklab,var(--color-on-surface)40%,var(--color-secondary)) ${step * i}deg 360deg)`;
            if (i > chapter_list.length + 1) {
              clearInterval(interval);
              toggle.style.background = "";
              toggle.style.pointerEvents = "";
            }
          }, 100);
        });
    }
  }
})();
