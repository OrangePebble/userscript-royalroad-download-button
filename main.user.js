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
// @grant       GM.xmlHttpRequest
// @resource    FICTION_BUTTON_HTML http://localhost:3000/fiction-button.html
// @resource    CHAPTER_HTML http://localhost:3000/chapter.html
// @require     http://localhost:3000/add-fiction-button.js
// @require     http://localhost:3000/get-chapter-list.js
// @require     http://localhost:3000/get-chapter-content.js
// @require     http://localhost:3000/process-html.js
// @require     http://localhost:3000/download-multi-html.js
// @require     http://localhost:3000/utils.js
// ==/UserScript==

// TODO:
// - Update metadata above.
// - Figure out what would be the best way to allow the user to customize the downloaded file name.
// - Decide if I should have an option to only update metadata and not add chapters to existing file.
// - Decide if I should have an option to remove img elements if I couldn't fetch them.
// - Reorder functions, rethink where each function goes, move most of the code in this file into its own file. Also think about folders and their structure.
// - Figure out if I want an index file for multi html and an index section for single html.
// - Go through the whole finished userscript and:
//   - Add/improve comments;
//   - Add/improve JSDoc;
//   - Add/improve logging.

// INFO: In order to run local files I can use a simple webserver to serve all the files in this folder.
// I can't use "file://" because it is blocked either by Firefox or Violentmonkey.
// I found "https://github.com/vercel/serve" that I can run with just ", serve .".

// NOTE:
// Decisions:
// - As both the fiction and chapter buttons now require a popup for the "extend with new chapters" input,
//   there is no point in having the options in the Violentmonkey extension. So all options will now stay
//   in the popup.
// - Everytime an option in the popup is changed the state is saved and it becomes the default option.
// - I'll be adding more "console.debug/info/warn/error"s everywhere, no point in keeping the console clean.
//   - Don't use "console.log" to let devs filter the other logs and keep their temporary ones.
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
// - Update metadata: true or false
//   - Title, author name, tags, cover
// - Start and end chapter selection.

const FICTION_REGEX = new RegExp(
  /^https:\/\/www.royalroad.com\/fiction\/(\d+)\/[^\/]+\/?[^\/]*$/,
);
const CHAPTER_REGEX = new RegExp(
  /^https:\/\/www.royalroad.com\/fiction\/\d+\/[^\/]+\/chapter\/(\d+)\/[^\/]+\/?[^\/]*$/,
);
// Not sure if this is the correct name for it, but it's an exception I found in
// https://www.royalroad.com/fiction/chapter/1671376?fid=52639&fslug=edge-cases-complete
const CORRUPTED_CHAPTER_REGEX = new RegExp(
  /^https:\/\/www.royalroad.com\/fiction\/chapter\/(\d+)\/?[^\/]*$/,
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

        const fiction_title = document.getElementsByTagName("h1")[0].innerText;
        const author = document.querySelector("#chapterHeroData h4").innerText;
        const cover_url = document.querySelector(
          ".cover-art-container > img",
        ).src;

        /**
         * @type {{title: string, url: string, chapter_html: HTMLElement, start_note_html: HTMLElement | null, end_note_html: HTMLElement | null, created_date: string, edited_date: string}[]}
         */
        let processed_chapters = [];
        for (let i = 0; i < chosen_chapters_list.length; i++) {
          let chapter_content = await getChapterContent(
            chosen_chapters_list[i].url,
          );
          let chapter_html = chapter_content.chapter_html;
          let start_note_html = chapter_content.start_note_html;
          let end_note_html = chapter_content.end_note_html;
          let created_date = chapter_content.created_date;
          let edited_date = chapter_content.edited_date;
          chapter_html = await processHtml(chapter_html);
          chapter_html = await embedImagesAsBase64(chapter_html);
          if (start_note_html !== null) {
            start_note_html = await processHtml(start_note_html);
            start_note_html = await embedImagesAsBase64(start_note_html);
          }
          if (end_note_html !== null) {
            end_note_html = await processHtml(end_note_html);
            end_note_html = await embedImagesAsBase64(end_note_html);
          }
          processed_chapters.push({
            title: chosen_chapters_list[i].title,
            url: chosen_chapters_list[i].url,
            chapter_html,
            start_note_html,
            end_note_html,
            created_date,
            edited_date,
          });
        }
        downloadMultiHtml(fiction_title, author, cover_url, processed_chapters);
      });
    }
  }
})();
