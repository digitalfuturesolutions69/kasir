import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "receipts");

export const ALLOWED_RECEIPT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Raw upload cap, checked before the image is normalized/compressed
// server-side. Must stay comfortably under next.config.ts's
// serverActions.bodySizeLimit (8mb) to leave room for multipart overhead.
export const MAX_RECEIPT_SIZE_BYTES = 7 * 1024 * 1024; // 7MB

export async function saveReceiptImage(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = ALLOWED_RECEIPT_TYPES[mimeType];
  if (!ext) {
    throw new Error("Tipe file tidak didukung");
  }

  const userDir = path.join(STORAGE_ROOT, userId);
  await fs.mkdir(userDir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(userDir, filename), buffer);

  return `${userId}/${filename}`;
}

/**
 * Resolves a stored relative receipt path to an absolute path, rejecting
 * anything that would escape the storage root (e.g. "../../etc/passwd").
 */
export function resolveReceiptPath(relativePath: string): string {
  const absolute = path.join(STORAGE_ROOT, relativePath);
  if (!absolute.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error("Path tidak valid");
  }
  return absolute;
}

export function mimeTypeForPath(relativePath: string): string {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}
