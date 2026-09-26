/**
 * @param {string} image_url
 * @returns {Promise<Blob | void>}
 */
async function fetchImage(image_url) {
  try {
    // Not using fetch() because it is subject to the page's CORS policy and
    //  because images may require being redirected.
    const request = await GM.xmlHttpRequest({
      url: image_url,
      responseType: "blob",
      anonymous: true,
    });
    if (request.status < 200 || request.status >= 400) {
      throw new Error(`Failed to fetch image (HTTP ${request.status})`);
    }

    return request.response;
  } catch (error) {
    // If this fails, other images can still be downloaded, so we check outside this function.
    console.error(error);
    return;
  }
}

/**
 * @param {Blob} image
 * @returns {Promise<string | void>}
 */
async function imageBlobToBase64(image) {
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
      if (image_url === null || image_url.startsWith("data:")) {
        return;
      }

      const image = await fetchImage(new URL(image_url, html.baseURI).href);
      if (image === undefined) {
        return;
      }

      const base64 = await imageBlobToBase64(image);
      if (base64 === undefined) {
        return;
      }

      image_element.setAttribute("src", `data:${image.type};base64,${base64}`);
    }),
  );

  return html;
}

/**
 * Cleans up and processes chapter html.
 * @param {HTMLHtmlElement} html
 * @returns {Promise<HTMLHtmlElement>}
 */
async function processHtml(html) {
  const p_elements = html.querySelectorAll("p");
  await Promise.all(
    Array.from(p_elements, async (p_element) => {
      p_element.removeAttribute("class");
    }),
  );

  const img_elements = html.querySelectorAll("img");
  await Promise.all(
    Array.from(img_elements, async (img_element) => {
      img_element.setAttribute(
        "onerror",
        // TODO: figure out what alternative image to use. maybe a "transparent" grid image. do svgs work here?
        `this.onerror=null; this.src=''`,
      );
    }),
  );

  return html;
}
