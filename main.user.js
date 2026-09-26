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
// @require     http://localhost:3000/get-chapter-content.js
// @require     http://localhost:3000/utils.js
// ==/UserScript==

// TODO:
// - Update metadata above.
// - Figure out what would be the best way to allow the user to customize the downloaded file name.

// INFO: In order to run local files I can use a simple webserver to serve all the files in this folder.
// I can't use "file://" because it is blocked either by Firefox or Violentmonkey.
// I found "https://github.com/vercel/serve" that I can run with just ", serve .".

// NOTE:
// Decisions:
// - As both the fiction and chapter buttons now require a popup for the "extend with new chapters" input,
//   there is no point in having the options in the Violentmonkey extension. So all options will now stay
//   in the popup.
// - Everytime an option in the popup is changed the state is saved and it becomes the default option.
// - I'll be adding more "console.debug/log/info/warn/error"s everywhere, no point in keeping the console clean.
// - The downloaded HTML files will save state in the URL (either in the search or hash sections [whatever
//   I can change without reloading]).
// - The downloaded HTML files will have options for changing theme, font, and font size.
//   - The default options will be the ones from the browser.
// - The downloaded HTML files will save the current progress.
//   - The progress will maybe be saved in "chapter" (for single HTML) and "line/percentage" parts for easier human reading.
// - The previous/next buttons for multiple HTML will keep the theme changes in the URL.
// - Embedded images will use Base64 (I need to check if that works for EPUB).
//
// NOTE:
// Options:
// - Select download format:
//   - Single EPUB
//   - Single HTML
//   - Multiple HTML in zip archive
// - Embed images: true or false
// - Extend existing file (if download format is single EPUB or HTML):
//   - Input to upload existing file
// - Update theme and font (if existing file is being extended and is HTML): true or false
// - Start and end chapter selection.

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
      addFictionButton();

      let firstClick = true;
      let toggle = document.getElementById("orangepebble-form-toggle");
      toggle.addEventListener("click", async () => {
        if (firstClick) {
          firstClick = false;
          chapter_list = await getChapterList();
          fillChapterSelects(chapter_list);
        }
      });

      let confirm = document.getElementById(
        "orangepebble-confirm-download-button",
      );
      confirm.addEventListener("click", async () => {
        // TODO: For each chapter between the start select and end select, get:
        //  - Chapter HTML content
        //  - Start note HTML content
        //  - End note HTML content
        // TODO: Take each HTML and convert the image links into embedded base64 images
        // TODO: Make changes to each HTML common to all download formats
        // TODO: Make changes to each HTML for the chosen download format
        let start_chapter_select = document.getElementById(
          "orangepebble-start-chapter-select",
        );
        let end_chapter_select = document.getElementById(
          "orangepebble-end-chapter-select",
        );
        const start_index = Number(start_chapter_select.value);
        const end_index = Number(end_chapter_select.value);
        const chosen_chapters_list = chapter_list.slice(
          start_index,
          end_index + 1,
        );
        for (let i = 0; i < chosen_chapters_list.length; i++) {
          let chapter_content = await getChapterContent(
            chosen_chapters_list[i].url,
          );
          console.log(
            chapter_content.chapter_html,
            chapter_content.start_note_html,
            chapter_content.end_note_html,
          );
        }
      });
    }
  }
})();
