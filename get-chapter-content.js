/**
 * @param {string} chapter_url
 * @returns {Promise<HTMLHtmlElement | void>}
 */
async function _fetchChapterHtml(chapter_url) {
  const html = await fetch(chapter_url, {
    credentials: "omit",
  })
    .then((response) => response.text())
    .then((text) => PARSER.parseFromString(text, "text/html"))
    .catch((error) => {
      // If this fails, other chapters can still be downloaded, so we check outside this function.
      console.error(error);
      return;
    });

  return html;
}

/**
 * @returns {Promise<{chapter_html: HTMLElement, start_note_html: HTMLElement | null, end_note_html: HTMLElement | null}>}
 */
async function getChapterContent(url = null) {
  if (url === null) {
    if (
      !CHAPTER_REGEX.test(window.location.href) &&
      !CORRUPTED_CHAPTER_REGEX.test(window.location.href)
    ) {
      return null;
    }
  } else {
    if (!CHAPTER_REGEX.test(url) && !CORRUPTED_CHAPTER_REGEX.test(url)) {
      return null;
    }
  }
  let chapter_html, start_note_html, end_note_html;
  if (url === null) {
    chapter_html = document.getElementsByClassName("chapter-content")[0];
    start_note_html = document.querySelector(
      ".author-note-card:has(~ .chapter-content)",
    );
    end_note_html = document.querySelector(
      ".chapter-content ~ .author-note-card",
    );
  } else {
    let html = await _fetchChapterHtml(url);
    chapter_html = html.getElementsByClassName("chapter-content")[0];
    start_note_html = html.querySelector(
      ".author-note-portlet:has(~ .chapter-content)",
    );
    end_note_html = html.querySelector(
      ".chapter-content ~ .author-note-portlet",
    );
  }
  return { chapter_html, start_note_html, end_note_html };
}
