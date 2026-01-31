import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const UPLOAD_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/upload`;

interface UploadResponse {
  url?: string;
  error?: string;
}

interface DeleteResponse {
  success?: boolean;
  error?: string;
}

export async function uploadFile(
  file: File,
  path: string
): Promise<UploadResponse> {
  try {
    // Get current session for Supabase JWT
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { error: "Not authenticated" };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);
    formData.append("action", "upload");

    const response = await fetch(UPLOAD_FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Upload failed" };
    }

    return { url: result.url };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function deleteFile(path: string): Promise<DeleteResponse> {
  try {
    // Get current session for Supabase JWT
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { error: "Not authenticated" };
    }

    const formData = new FormData();
    formData.append("path", path);
    formData.append("action", "delete");

    const response = await fetch(UPLOAD_FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Delete failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return {
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Helper to generate unique file paths
export function generateFilePath(
  folder: string,
  filename: string,
  prefix?: string
): string {
  const ext = filename.split(".").pop();
  const timestamp = Date.now();
  const basePath = prefix ? `${folder}/${prefix}` : folder;
  return `${basePath}/${timestamp}.${ext}`;
}

// Helper to generate chapter page paths with organized folder structure
// Format: series/{seriesId}/chapters/{chapterNumber}/{page}.{ext}
export function generateChapterPagePath(
  seriesId: string,
  chapterNumber: number,
  pageNumber: number,
  extension: string
): string {
  return `series/${seriesId}/chapters/${chapterNumber}/${pageNumber}.${extension}`;
}

// Helper to generate cover image path
export function generateCoverPath(seriesId: string, extension: string): string {
  return `series/${seriesId}/cover.${extension}`;
}

// Helper to generate banner image path
export function generateBannerPath(seriesId: string, extension: string): string {
  return `series/${seriesId}/banner.${extension}`;
}

// Helper to generate PDF path
export function generatePdfPath(
  seriesId: string,
  chapterNumber: number
): string {
  return `series/${seriesId}/chapters/${chapterNumber}/chapter.pdf`;
}
