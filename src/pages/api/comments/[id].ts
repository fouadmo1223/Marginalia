import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { Comment } from '../../../models/Comment';
import { Blog } from '../../../models/Blog';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { z } from 'zod';

export const prerender = false;

const updateSchema = z.object({ content: z.string().trim().min(1, 'Comment cannot be empty').max(2000) });

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id) return jsonError('Missing id', 400);

    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);

    await connectToDatabase();
    const comment = await Comment.findById(params.id);
    if (!comment || comment.deleted) return jsonError('Comment not found', 404);

    if (String(comment.author) !== String(locals.user._id)) {
      return jsonError('You can only edit your own comments', 403);
    }

    comment.content = parsed.data.content;
    comment.editedAt = new Date();
    await comment.save();

    return jsonOk({ comment });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const comment = await Comment.findById(params.id);
    if (!comment || comment.deleted) return jsonError('Comment not found', 404);

    const isOwner = String(comment.author) === String(locals.user._id);
    if (!isOwner && locals.user.role !== 'admin') {
      return jsonError('You can only delete your own comments', 403);
    }

    comment.deleted = true;
    comment.content = '[deleted]';
    await comment.save();
    await Blog.updateOne({ _id: comment.blog }, { $inc: { commentsCount: -1 } });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
};
