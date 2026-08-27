/**
 * Turns whatever the reader picked into a small square WebP.
 *
 * AI-DECISION: done in the browser rather than on the server. A phone camera
 * produces four megabytes; uploading that so the server can throw away 99.8% of
 * it wastes the one connection that is actually slow. The server still checks
 * the bytes it receives — this is a convenience, never the guard.
 *
 * AI-TRAP: quality is stepped down until the result fits, not set once. WebP
 * size depends on the picture as much as the setting: a flat graphic at 0.8 can
 * be a tenth the size of a photograph at the same number, and a fixed quality
 * would reject perfectly ordinary photographs.
 */

const SIDE = 256;
const STEPS = [0.85, 0.7, 0.55, 0.4, 0.3, 0.2];

/** Reads a File into an ImageBitmap, or an <img> where that is unavailable. */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Falls through to the <img> path, which handles a few formats Safari
      // will decode but will not hand to createImageBitmap.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @returns {Promise<Blob>} a WebP no larger than `maxBytes`
 * @throws if the file is not an image, or will not fit even at the lowest step
 */
export async function toWebp(file, maxBytes = 10 * 1024) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Fajl nije slika.');
  }

  const source = await decode(file);
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = SIDE;
  canvas.height = SIDE;
  const ctx = canvas.getContext('2d');

  // Centre-crop to a square before scaling, so a portrait photograph does not
  // arrive squashed.
  const side = Math.min(width, height);
  ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, SIDE, SIDE);

  for (const quality of STEPS) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) throw new Error('Preglednik ne podržava WebP.');
    if (blob.size <= maxBytes) return blob;
  }

  throw new Error('Slika je prevelika. Probaj jednostavniju sliku.');
}
