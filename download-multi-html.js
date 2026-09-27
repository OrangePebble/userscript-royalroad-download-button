/**
 * @param {string} fiction_title
 * @param {string} author
 * @param {string} cover_url
 * @param {{title: string, url: string, chapter_html: HTMLElement, start_note_html: HTMLElement | null, end_note_html: HTMLElement | null, created_date: string, edited_date: string}[]} chapters
 * @returns {Promise<void>}
 */
async function downloadMultiHtml(fiction_title, author, cover_url, chapters) {
  if (!chapters.length) {
    return;
  }

  try {
    const zip = new JSZip();
    const archive_name = filenamePart(fiction_title) || "royal-road-fiction";
    const folder = zip.folder(archive_name);
    const chapter_number_width = String(chapters.length).length;
    const chapter_filenames = chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(chapter_number_width, "0");
      return `${number} - ${filenamePart(chapter.title) || "Chapter"}.html`;
    });

    for (const [index, chapter] of chapters.entries()) {
      folder.file(
        chapter_filenames[index],
        createChapterHtml(
          fiction_title,
          author,
          chapter,
          index > 0 ? chapter_filenames[index - 1] : null,
          chapter_filenames[index + 1] ?? null,
        ),
      );
      setProgress(((index + 1) / chapters.length) * (2 / 12) + 3 / 4);
    }

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
    saveAs(blob, `${archive_name}.zip`);
  } catch (error) {
    console.error("Failed to create the chapter download.", error);
    alert(
      "Failed to create the chapter download. More information is in the console.",
    );
  }
}

/**
 * Makes a title safe for both ZIP entry names and common file systems.
 * @param {string} value
 * @returns {string}
 */
function filenamePart(value) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();
}

/**
 * @param {Document} document
 * @param {string} selector
 * @param {HTMLElement | null} content
 */
function insertChapterContent(document, selector, content) {
  const element = document.querySelector(selector);
  element.replaceChildren(...(content?.cloneNode(true).childNodes ?? []));
  element.hidden = content === null;
}

/**
 * @param {string} fiction_title
 * @param {string} author
 * @param {{title: string, chapter_html: HTMLElement, start_note_html: HTMLElement | null, end_note_html: HTMLElement | null, created_date: string, edited_date: string}} chapter
 * @param {string | null} previous_filename
 * @param {string | null} next_filename
 * @returns {string}
 */
function createChapterHtml(
  fiction_title,
  author,
  chapter,
  previous_filename,
  next_filename,
) {
  const chapter_document = PARSER.parseFromString(
    GM.getResourceText("CHAPTER_HTML"),
    "text/html",
  );

  chapter_document.title = `${chapter.title} — ${fiction_title}`;
  chapter_document.querySelector("#fiction-title h2").textContent =
    fiction_title;
  chapter_document.querySelector("#chapter-title h1").textContent =
    chapter.title;
  chapter_document.querySelector("#author h4").textContent = author;
  insertChapterContent(
    chapter_document,
    "#start-note",
    chapter.start_note_html,
  );
  insertChapterContent(
    chapter_document,
    "#chapter-content",
    chapter.chapter_html,
  );
  insertChapterContent(chapter_document, "#end-note", chapter.end_note_html);

  for (const button_selector of ["#top-prev-button", "#bottom-prev-button"]) {
    const button = chapter_document.querySelector(button_selector);
    if (previous_filename !== null) {
      button.href = encodeURIComponent(previous_filename);
    }
  }
  for (const button_selector of ["#top-next-button", "#bottom-next-button"]) {
    const button = chapter_document.querySelector(button_selector);
    if (next_filename !== null) {
      button.href = encodeURIComponent(next_filename);
    }
  }

  for (const [selector, date] of [
    ["#created-date", chapter.created_date],
    ["#edited-date", chapter.edited_date],
  ]) {
    const element = chapter_document.querySelector(selector);
    element.dateTime = date;
    element.textContent = new Date(date).toLocaleString();
  }

  return `<!doctype html>\n${chapter_document.documentElement.outerHTML}`;
}
