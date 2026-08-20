import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Only JPEG, PNG, WEBP, or GIF images are allowed.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Images must be smaller than 8MB.');
  }
}

export async function uploadImage(file: File, folder: string): Promise<UploadedImage> {
  validateImageFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Automatic format + quality selection for optimal delivery.
        fetch_format: 'auto',
        quality: 'auto',
        transformation: [{ width: 2400, crop: 'limit' }],
      },
      (error, uploadResult) => {
        if (error) reject(new Error(describeCloudinaryError(error)));
        else resolve(uploadResult);
      },
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

/** Turns raw Cloudinary SDK errors into a message safe to show end users. */
function describeCloudinaryError(error: any): string {
  if (error?.http_code === 403) {
    return 'Image uploads are temporarily unavailable (storage provider misconfigured). Please try again later.';
  }
  return 'Image upload failed. Please try again.';
}

/**
 * Downloads an image and re-uploads the bytes via the same upload_stream path as
 * real user uploads — used by the seed script. Deliberately avoids Cloudinary's
 * "fetch from remote URL" upload mode, which many accounts have disabled by default
 * for security (unsigned remote fetch is a common SSRF vector).
 */
export async function uploadFromUrl(remoteUrl: string, folder: string, publicId?: string): Promise<UploadedImage> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Failed to download ${remoteUrl}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        fetch_format: 'auto',
        quality: 'auto',
        overwrite: true,
        transformation: [{ width: 2400, crop: 'limit' }],
      },
      (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      },
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

/** Builds a responsive, auto-optimized delivery URL from a stored publicId. */
export function cloudinaryUrl(publicId: string, width?: number): string {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
    ...(width ? { width, crop: 'scale' } : {}),
  });
}
