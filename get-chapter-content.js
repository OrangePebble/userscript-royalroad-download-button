/**
 * @param {string} chapter_url
 * @returns {Promise<HTMLHtmlElement | void>}
 */
async function _fetchChapterHtml(chapter_url) {
  try {
    // Not using a regular fetch with the user's cookies in order to
    //  get the redesigned UI because that would change the user's
    //  reading history, and fetch can't customize cookies.
    const request = await GM.xmlHttpRequest({
      method: "GET",
      url: chapter_url,
      responseType: "text",
      cookie: "rr_ui_mode=redesign;",
    });
    if (request.status < 200 || request.status >= 400) {
      throw new Error(`Failed to fetch chapter (HTTP ${request.status})`);
    }
    return PARSER.parseFromString(request.response, "text/html");
  } catch (error) {
    // If this fails, other chapters can still be downloaded, so we check outside this function.
    console.error(error);
    return;
  }
}

/**
 * @returns {Promise<{chapter_html: HTMLElement, start_note_html: HTMLElement | null, end_note_html: HTMLElement | null, created_date: string, edited_date: string}>}
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
  let chapter_html, start_note_html, end_note_html, created_date, edited_date;
  if (url === null) {
    chapter_html = document.getElementsByClassName("chapter-content")[0];
    start_note_html = document.querySelector(
      ".author-note-card:has(~ .chapter-content) > div.author-note > div > div > div > div",
    );
    end_note_html = document.querySelector(
      ".chapter-content ~ .author-note-card > div.author-note > div > div > div > div",
    );
    created_date = document
      .querySelector(
        ".chapter > div:last-child > div:last-child > span > div:nth-child(1) > div:nth-child(1) > time",
      )
      .getAttribute("datetime");
    edited_date = document
      .querySelector(
        ".chapter > div:last-child > div:last-child > span > div:nth-child(2) > div:nth-child(1) > time",
      )
      .getAttribute("datetime");
  } else {
    let html = await _fetchChapterHtml(url);
    chapter_html = html.getElementsByClassName("chapter-content")[0];
    start_note_html = html.querySelector(
      ".author-note-card:has(~ .chapter-content) > div.author-note > div > div > div > div",
    );
    end_note_html = html.querySelector(
      ".chapter-content ~ .author-note-card > div.author-note > div > div > div > div",
    );
    created_date = html
      .querySelector(
        ".chapter > div:last-child > div:last-child > span > div:nth-child(1) > div:nth-child(1) > time",
      )
      .getAttribute("datetime");
    edited_date = html
      .querySelector(
        ".chapter > div:last-child > div:last-child > span > div:nth-child(2) > div:nth-child(1) > time",
      )
      .getAttribute("datetime");
  }
  return {
    chapter_html,
    start_note_html,
    end_note_html,
    created_date,
    edited_date,
  };
}
