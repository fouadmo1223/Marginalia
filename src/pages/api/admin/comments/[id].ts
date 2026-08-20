import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Comment } from '../../../../models/Comment';
import { Blog } from '../../../../models/Blog';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const comment = await Comment.findById(params.id);
    if (!comment || comment.deleted) return jsonError('Comment not found', 404);

    comment.deleted = true;
    comment.content = '[removed by moderator]';
    await comment.save();
    await Blog.updateOne({ _id: comment.blog }, { $inc: { commentsCount: -1 } });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
};
