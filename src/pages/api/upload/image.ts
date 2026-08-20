import type { APIRoute } from 'astro';
import { uploadImage } from '../../../lib/cloudinary';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { rateLimit } from '../../../lib/rate-limit';

export const prerender = false;

const MAX_IMAGES_PER_HOUR = 60;

// Generic image upload used by the blog editor for cover / inline content images.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);

    const limited = rateLimit(`upload:${String(locals.user._id)}`, MAX_IMAGES_PER_HOUR, 60 * 60 * 1000);
    if (!limited.allowed) return jsonError('Upload limit reached. Try again later.', 429);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return jsonError('No file provided', 400);

    const image = await uploadImage(file, `blogs/${String(locals.user._id)}`);
    return jsonOk({ image });
  } catch (err) {
    if (err instanceof Error) return jsonError(err.message, 400);
    return handleApiError(err);
  }
};
