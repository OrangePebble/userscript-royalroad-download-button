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

  disableButton();
  setProgress(0);

  try {
    const zip = new JSZip();
    const archive_name = filenamePart(fiction_title) || "royal-road-fiction";
    const folder = zip.folder(archive_name);
    const chapter_number_width = String(chapters.length).length;
    const chapter_filenames = chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(chapter_number_width, "0");
      return `${number} - ${filenamePart(chapter.title) || "Chapter"}.html`;
    });

    folder.file(
      "index.html",
      createIndexHtml(fiction_title, author, chapters, chapter_filenames),
    );

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
      setProgress((index + 1) / chapters.length);
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
  } finally {
    enableButton();
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
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

/**
 * @param {HTMLElement | null} element
 * @returns {string}
 */
function elementHtml(element) {
  return element === null ? "" : element.outerHTML;
}

/**
 * @param {string} fiction_title
 * @param {string} author
 * @param {{title: string}[]} chapters
 * @param {string[]} chapter_filenames
 * @returns {string}
 */
function createIndexHtml(fiction_title, author, chapters, chapter_filenames) {
  const chapter_links = chapters
    .map(
      (chapter, index) =>
        `<li><a href="${encodeURIComponent(chapter_filenames[index])}">${escapeHtml(chapter.title)}</a></li>`,
    )
    .join("");

  return createDocument(
    fiction_title,
    `<header><h1>${escapeHtml(fiction_title)}</h1><p>by ${escapeHtml(author)}</p></header><main><h2>Chapters</h2><ol>${chapter_links}</ol></main>`,
  );
}

/**
 * @param {string} fiction_title
 * @param {string} author
 * @param {{title: string, chapter_html: HTMLElement, start_note_html: HTMLElement | null, end_note_html: HTMLElement | null}} chapter
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
  const navigation = `<nav><span>${
    previous_filename
      ? `<a href="${encodeURIComponent(previous_filename)}">Previous</a>`
      : "Previous"
  }</span><a href="index.html">Index</a><span>${
    next_filename
      ? `<a href="${encodeURIComponent(next_filename)}">Next</a>`
      : "Next"
  }</span></nav>`;
  const content = `${elementHtml(chapter.start_note_html)}${elementHtml(
    chapter.chapter_html,
  )}${elementHtml(chapter.end_note_html)}`;

  return createDocument(
    `${chapter.title} — ${fiction_title}`,
    `<header><h1>${escapeHtml(chapter.title)}</h1><p>${escapeHtml(fiction_title)} by ${escapeHtml(author)}</p></header>${navigation}<main>${content}</main>${navigation}`,
  );
}

/**
 * @param {string} title
 * @param {string} body
 * @returns {string}
 */
function createDocument(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root { color-scheme: dark; font-family: "Open Sans", "Helvetica Neue", Arial, sans-serif; line-height: 1.55; }
body { max-width: 970px; margin: 0 auto; padding: 1rem; background: #181818; color: hsla(0, 0%, 100%, .8); font-size: 16px; }
header, main, nav { background: #131313; border: 1px solid hsla(0, 0%, 100%, .1); padding: 1rem 1.25rem; }
header { margin-bottom: 1rem; } h1, h2 { color: #fff; } h1 { margin: 0; } header p { margin-bottom: 0; }
main { margin: 1rem 0; } a { color: #58a6ff; } img { height: auto !important; max-width: 100%; }
.author-note-portlet, .author-note-card { background: #393939; padding: .75rem 1rem; margin: 1rem 0; }
nav { display: flex; justify-content: space-between; gap: 1rem; } nav span { color: #888; } nav span a { color: #58a6ff; }
table { max-width: 100%; } pre { overflow-x: auto; white-space: pre-wrap; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
