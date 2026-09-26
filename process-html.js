/**
 * @param {string} image_url
 * @returns {Promise<Blob | void>}
 */
async function _fetchImage(image_url) {
  const image = await fetch(image_url, {
    credentials: "omit",
  })
    .then((response) => response.blob())
    .catch((error) => {
      // If this fails, other images can still be downloaded, so we check outside this function.
      console.error(error);
      return;
    });

  return image;
}

/**
 * @param {Blob} image
 * @returns {Promise<string | void>}
 */
async function _imageBlobToBase64(image) {
  return await new Promise((resolve) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      // readAsDataURL() prefixes the Base64 payload with its media type.
      resolve(reader.result.split(",", 2)[1]);
    });
    reader.addEventListener("error", () => {
      console.error(reader.error);
      resolve();
    });

    reader.readAsDataURL(image);
  });
}

/**
 * Fetches every SVG <image> source and replaces it with a Base64 data URL.
 * @param {HTMLHtmlElement} html
 * @returns {Promise<HTMLHtmlElement>}
 */
async function embedImagesAsBase64(html) {
  const image_elements = html.querySelectorAll("img");

  await Promise.all(
    Array.from(image_elements, async (image_element) => {
      const image_url = image_element.getAttribute("src");
      console.log(image_url);
      if (image_url === null || image_url.startsWith("data:")) {
        return;
      }

      const image = await _fetchImage(new URL(image_url, html.baseURI).href);
      if (image === undefined) {
        return;
      }

      const base64 = await _imageBlobToBase64(image);
      if (base64 === undefined) {
        return;
      }

      image_element.setAttribute("src", `data:${image.type};base64,${base64}`);
      console.log(base64);
    }),
  );

  return html;
}
