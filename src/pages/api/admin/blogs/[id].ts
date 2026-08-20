import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Blog } from '../../../../models/Blog';
import { Comment } from '../../../../models/Comment';
import { Like } from '../../../../models/Like';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { deleteImage } from '../../../../lib/cloudinary';
import { z } from 'zod';

export const prerender = false;

const patchSchema = z.object({ status: z.enum(['draft', 'published']) });

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return jsonError('Invalid input', 422);

    await connectToDatabase();
    const blog = await Blog.findById(params.id);
    if (!blog) return jsonError('Blog not found', 404);

    blog.status = parsed.data.status;
    if (blog.status === 'published' && !blog.publishedAt) blog.publishedAt = new Date();
    await blog.save();

    return jsonOk({ blog });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const blog = await Blog.findById(params.id);
    if (!blog) return jsonError('Blog not found', 404);

    const imagesToDelete = [blog.coverImage, ...blog.images].filter(Boolean) as { publicId: string }[];
    await Promise.all(imagesToDelete.map((img) => deleteImage(img.publicId).catch(() => null)));

    await Comment.deleteMany({ blog: blog._id });
    await Like.deleteMany({ blog: blog._id });
    await blog.deleteOne();

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
};
