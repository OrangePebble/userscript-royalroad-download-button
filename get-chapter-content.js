/**
 * @param {string} chapter_url
 * @returns {Promise<HTMLHtmlElement | void>}
 */
async function fetchChapterHtml(chapter_url) {
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
 * @returns {{chapter_html: HTMLElement, start_note_html: HTMLElement | null, end_note_html: HTMLElement | null}}
 */
async function getChapterContent(url = null) {
  if (
    (url === null && !CHAPTER_REGEX.test(window.location.href)) ||
    (url === null && !CORRUPTED_CHAPTER_REGEX.test(window.location.href)) ||
    (url !== null && !CHAPTER_REGEX.test(url))
  ) {
    return null;
  }
  return { chapter_html: 0, start_note_html: 1, end_note_html: null };
}
