import sharp from "sharp";

export const MAX_UPLOAD = 4 * 1024 * 1024;

/** Normalises an uploaded photo to a web-sized JPEG. Returns base64, or an error message. */
export async function processImage(file: File): Promise<{ b64: string } | { error: string }> {
  if (file.size > MAX_UPLOAD) return { error: "Image is too large (max 4 MB)." };
  try {
    const out = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate() // honour phone orientation
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return { b64: out.toString("base64") };
  } catch {
    return { error: "That file doesn't look like an image." };
  }
}
