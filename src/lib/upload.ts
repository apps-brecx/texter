/**
 * Upload rules, shared by the browser and the API route so the two can't drift.
 *
 * Images are normalised server-side before they're stored, so the raw limit can
 * be generous — drop a 30 MB phone photo and it lands as a ~1 MB JPEG. PDFs are
 * stored and sent as-is, so their limit is set by what the model APIs accept:
 * base64 inflates a file by about a third, and both providers cap a request at
 * 32 MB.
 */

export const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const PDF_TYPE = "application/pdf";

export const ACCEPTED_TYPES: string[] = [...IMAGE_TYPES, PDF_TYPE];

export const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(",");

export const MAX_IMAGE_BYTES = 40 * 1024 * 1024;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

/** What a normalised image gets resized and re-encoded to before storage. */
export const IMAGE_LONG_EDGE = 2200;
export const IMAGE_QUALITY = 85;

export function isPdf(mimeType: string | null | undefined) {
  return mimeType === PDF_TYPE;
}

export function isAcceptedType(mimeType: string) {
  return ACCEPTED_TYPES.includes(mimeType);
}

export function limitFor(mimeType: string) {
  return isPdf(mimeType) ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}
