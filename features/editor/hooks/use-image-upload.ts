// =============================================================================
// useImageUpload Hook
// =============================================================================
// Encapsulates the presigned-upload flow for images: client picks a file →
// POST /api/storage/upload to get a presigned S3 URL → PUT the file directly
// to S3 → return the public URL. No file bytes transit through the app
// server — the upload goes straight to S3, keeping the server lean.
//
// Usage:
//   const { upload, isUploading, url, error } = useImageUpload();
//   const result = await upload(file, projectId);  // result.url is the public S3 URL
// =============================================================================

'use client';

import { useState, useCallback } from 'react';

interface UseImageUploadReturn {
  upload: (file: File, projectId: string, type?: 'images' | 'uploads') => Promise<string | null>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, projectId: string, type: 'images' | 'uploads' = 'uploads'): Promise<string | null> => {
      setIsUploading(true);
      setError(null);

      try {
        // Step 1: Request a presigned upload URL from our API
        const presignResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            filename: file.name,
            contentType: file.type,
            type,
          }),
        });

        const presignBody = await presignResponse.json();

        if (!presignResponse.ok || !presignBody.success) {
          const msg =
            presignBody?.error?.message ??
            `Upload preparation failed (${presignResponse.status})`;
          setError(msg);
          setIsUploading(false);
          return null;
        }

        const { uploadUrl, key } = presignBody.data as {
          uploadUrl: string;
          key: string;
        };

        // Step 2: PUT the file directly to S3 via the presigned URL
        const putResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!putResponse.ok) {
          setError(`File upload failed (${putResponse.status})`);
          setIsUploading(false);
          return null;
        }

        // Step 3: Construct the public URL from the key
        // The public URL base is configured via S3_PUBLIC_URL env var;
        // if that's not set, fall back to the standard S3 URL pattern.
        const publicBase =
          process.env.NEXT_PUBLIC_S3_PUBLIC_URL ||
          process.env.S3_PUBLIC_URL ||
          `https://${process.env.NEXT_PUBLIC_S3_BUCKET || 'ai-website-builder-assets'}.s3.amazonaws.com`;
        const publicUrl = `${publicBase}/${key}`;

        setIsUploading(false);
        return publicUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred during upload';
        setError(message);
        setIsUploading(false);
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { upload, isUploading, error, clearError };
}
