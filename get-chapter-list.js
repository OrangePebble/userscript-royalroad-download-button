/**
 * Gets either the current
 * @param {string?} [url]
 * @returns {Promise<HTMLHtmlElement | null>}
 */
async function _getFictionHtml(url) {
  // I could've gotten the current page with `document.querySelector("html").cloneNode(true)`,
  //  but I'd then have to confirm that it contained all the chapters.
  // Downloading the chapters will require internet anyways so I don't think its worth the added workflow complexity.

  if (
    (url === null && !FICTION_REGEX.test(window.location.href)) ||
    (url !== null && !FICTION_REGEX.test(url))
  ) {
    return null;
  }
  if (url === null) {
    url = window.location.href;
  }

  return await fetch(url, {
    credentials: "omit",
  })
    .then((response) => response.text())
    .then((text) => PARSER.parseFromString(text, "text/html"))
    .catch((error) => {
      // If we can't get the list, nothing else would work so we can just throw.
      alert(
        "An error has ocurred while fetching the chapter list. Please refresh and try again. More details in the console.",
      );
      throw error;
    });
}

/**
 * Gets all the chapters from a fiction page.
 * If url is null, the current page is used.
 * @param {string} [url]
 * @returns {Promise<[{title: string, url: string, date: string}]>}
 */
async function getChapterList(url = null) {
  let html = await _getFictionHtml(url);
  if (html === null) {
    return [];
  }

  // WARN: This is the query for the old UI chapters, which still seems to be
  //  the same in the new UI before it renders and JavaScript does its thing.
  // This is likely to change when they completely phase out the old UI.
  const chapter_metadata_list = [
    ...html.querySelectorAll("tr.chapter-row"),
  ].map((element) => {
    const left_link = element.querySelector("td:not(.text-right) a");
    return {
      title: left_link.innerText.trim(),
      url: left_link.href,
    };
  });

  return chapter_metadata_list;
}
