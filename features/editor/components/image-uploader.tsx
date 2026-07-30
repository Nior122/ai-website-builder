// =============================================================================
// ImageUploader Component
// =============================================================================
// Reusable image upload widget for picking, previewing, and uploading images
// to S3 via presigned URLs. Shows the current image (if any), a click-to-upload
// area with drag-and-drop, upload progress, and a clear/remove button.
//
// Used for: favicon, OG image, project thumbnail, section images.
// =============================================================================

'use client';

import { useRef, useCallback, useState } from 'react';
import { useImageUpload } from '../hooks/use-image-upload';
import { ImagePlus, Loader2, X } from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────

interface ImageUploaderProps {
  /** Current image URL (null means no image). */
  value: string | null;
  /** Called with the new public URL after upload, or null when cleared. */
  onChange: (url: string | null) => void;
  /** Project ID for the upload route. */
  projectId: string;
  /** Accept filter for the file input. */
  accept?: string;
  /** Human-readable label. */
  label?: string;
  /** Optional class name for the outer container. */
  className?: string;
  /** S3 upload folder type. */
  type?: 'images' | 'uploads';
  /** Aspect ratio hint for the preview area (e.g. '16/9', '1/1'). */
  aspectRatio?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ImageUploader({
  value,
  onChange,
  projectId,
  accept = 'image/*',
  label,
  className = '',
  type = 'uploads',
  aspectRatio = '16/9',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, error, clearError } = useImageUpload();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const url = await upload(file, projectId, type);
      if (url) {
        onChange(url);
      }
    },
    [upload, projectId, type, onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          {label}
        </label>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : value
              ? 'border-neutral-200 hover:border-neutral-300'
              : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100'
        }`}
        style={{ aspectRatio }}
      >
        {value ? (
          <>
            {/* Current image preview */}
            <img
              src={value}
              alt="Uploaded"
              className="h-full w-full object-contain"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xs font-medium text-white">
                Click to replace
              </span>
            </div>

            {/* Clear button */}
            <button
              onClick={handleClear}
              disabled={isUploading}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 disabled:opacity-50"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-2 text-neutral-400">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
            <span className="text-xs">
              {isUploading ? 'Uploading…' : 'Click or drag to upload'}
            </span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
