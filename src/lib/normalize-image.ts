import "server-only";
import sharp from "sharp";
import { IMAGE_LONG_EDGE, IMAGE_QUALITY } from "@/lib/upload";

/**
 * Shrinks an upload to something both the database and the model APIs are happy
 * with. A banner at 2200px is still comfortably readable for the model — the
 * point is to read the words, not to archive the artwork.
 *
 * Falls back to the original bytes if sharp can't decode the file, so an exotic
 * format degrades to "try it and see" rather than a hard failure.
 */
export async function normalizeImage(
  input: Buffer,
  mimeType: string,
): Promise<{ data: Buffer; mimeType: string; width?: number; height?: number }> {
  try {
    const image = sharp(input, { animated: false, failOn: "none" });
    const meta = await image.metadata();
    const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);

    // Already small and already a format the APIs accept — leave it alone.
    if (longEdge > 0 && longEdge <= IMAGE_LONG_EDGE && input.byteLength <= 1_500_000) {
      return { data: input, mimeType, width: meta.width, height: meta.height };
    }

    const resized = image.rotate().resize({
      width: IMAGE_LONG_EDGE,
      height: IMAGE_LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });

    // Transparency survives as PNG; everything else is cheaper as JPEG.
    const output = meta.hasAlpha
      ? await resized.png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true })
      : await resized.jpeg({ quality: IMAGE_QUALITY, mozjpeg: true }).toBuffer({ resolveWithObject: true });

    return {
      data: output.data,
      mimeType: meta.hasAlpha ? "image/png" : "image/jpeg",
      width: output.info.width,
      height: output.info.height,
    };
  } catch {
    return { data: input, mimeType };
  }
}
