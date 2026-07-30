// =============================================================================
// S3 / Cloudflare R2 Client
// =============================================================================
// File storage for images, exports, and assets.
// Compatible with both AWS S3 and Cloudflare R2.
// =============================================================================

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const globalForS3 = globalThis as unknown as {
  s3: S3Client | undefined;
};

export const s3 =
  globalForS3.s3 ??
  new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForS3.s3 = s3;
}

const BUCKET = process.env.S3_BUCKET || 'ai-website-builder-assets';
const PUBLIC_URL = process.env.S3_PUBLIC_URL || `https://${BUCKET}.s3.amazonaws.com`;

/**
 * Upload a file to S3.
 */
export async function uploadFile(params: {
  key: string;
  body: Buffer | Uint8Array | ReadableStream;
  contentType: string;
  cacheControl?: string;
}): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: params.key,
    Body: params.body as Buffer,
    ContentType: params.contentType,
    CacheControl: params.cacheControl || 'public, max-age=31536000',
  }));

  return `${PUBLIC_URL}/${params.key}`;
}

/**
 * Get a presigned URL for temporary access.
 */
export async function getPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Get a presigned upload URL for client-side uploads.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Delete a file from S3.
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

/**
 * Check if a file exists.
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate an S3 key for project assets.
 */
export function projectAssetKey(
  projectId: string,
  filename: string,
  type: 'images' | 'exports' | 'uploads' = 'uploads'
): string {
  return `projects/${projectId}/${type}/${filename}`;
}
