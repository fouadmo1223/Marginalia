import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';
import { uploadImage, deleteImage } from '../../../lib/cloudinary';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { rateLimit } from '../../../lib/rate-limit';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);

    const limited = rateLimit(`upload-avatar:${String(locals.user._id)}`, 10, 60 * 60 * 1000);
    if (!limited.allowed) return jsonError('Upload limit reached. Try again later.', 429);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return jsonError('No file provided', 400);

    const image = await uploadImage(file, `avatars/${String(locals.user._id)}`);

    await connectToDatabase();
    const previousPublicId = locals.user.avatarPublicId;

    await User.updateOne(
      { _id: locals.user._id },
      { avatarUrl: image.url, avatarPublicId: image.publicId },
    );

    if (previousPublicId) {
      await deleteImage(previousPublicId).catch(() => null);
    }

    return jsonOk({ avatarUrl: image.url });
  } catch (err) {
    if (err instanceof Error) return jsonError(err.message, 400);
    return handleApiError(err);
  }
};
