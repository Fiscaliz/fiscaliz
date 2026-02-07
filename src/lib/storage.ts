import { supabase } from "@/integrations/supabase/client";

const BUCKET = "fiscal-photos";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Extracts the storage path from a full public URL or returns the path as-is.
 * Handles legacy URLs like: https://xxx.supabase.co/storage/v1/object/public/fiscal-photos/path
 */
export function extractStoragePath(urlOrPath: string): string {
  if (!urlOrPath) return urlOrPath;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = urlOrPath.indexOf(marker);
  if (idx !== -1) {
    return urlOrPath.substring(idx + marker.length);
  }
  // Also handle signed URL paths
  const signedMarker = `/storage/v1/object/sign/${BUCKET}/`;
  const sIdx = urlOrPath.indexOf(signedMarker);
  if (sIdx !== -1) {
    const pathWithQuery = urlOrPath.substring(sIdx + signedMarker.length);
    return pathWithQuery.split("?")[0];
  }
  return urlOrPath;
}

/**
 * Gets a signed URL for a file in the fiscal-photos bucket.
 * If the input is a full public URL, it extracts the path first.
 */
export async function getSignedUrl(urlOrPath: string): Promise<string> {
  if (!urlOrPath) return urlOrPath;
  const path = extractStoragePath(urlOrPath);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return urlOrPath; // fallback to original
  }
  return data.signedUrl;
}

/**
 * Gets signed URLs for multiple files in batch.
 */
export async function getSignedUrls(urlsOrPaths: string[]): Promise<string[]> {
  if (!urlsOrPaths.length) return [];
  const paths = urlsOrPaths.map(extractStoragePath);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_EXPIRY);
  if (error || !data) {
    console.error("Failed to create signed URLs:", error);
    return urlsOrPaths;
  }
  return data.map((d, i) => d.signedUrl || urlsOrPaths[i]);
}

/**
 * Uploads a file and returns the storage path (NOT a public URL).
 */
export async function uploadFile(
  fileName: string,
  file: File | Blob,
  options?: { upsert?: boolean }
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: options?.upsert ?? true });
  if (error) throw error;
  return fileName; // Return path, not URL
}
