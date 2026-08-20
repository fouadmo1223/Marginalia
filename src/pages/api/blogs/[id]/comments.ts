import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Blog } from '../../../../models/Blog';
import { Comment } from '../../../../models/Comment';
import { commentSchema } from '../../../../lib/validation/blog';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { createNotification } from '../../../../lib/notify';
import { isBlockedEitherWay } from '../../../../lib/social';
import { rateLimit } from '../../../../lib/rate-limit';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET: APIRoute = async ({ params, url }) => {
  try {
    if (!params.id) return jsonError('Missing id', 400);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonError('Invalid query', 422);
    const { page, limit } = parsed.data;

    await connectToDatabase();

    const filter = { blog: params.id, parent: null, deleted: false };
    const total = await Comment.countDocuments(filter);
    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username name avatarUrl')
      .lean();

    const replies = await Comment.find({ blog: params.id, parent: { $in: comments.map((c) => c._id) }, deleted: false })
      .sort({ createdAt: 1 })
      .populate('author', 'username name avatarUrl')
      .lean();

    const repliesByParent = new Map<string, typeof replies>();
    for (const reply of replies) {
      const key = String(reply.parent);
      if (!repliesByParent.has(key)) repliesByParent.set(key, []);
      repliesByParent.get(key)!.push(reply);
    }

    const withReplies = comments.map((c) => ({ ...c, replies: repliesByParent.get(String(c._id)) ?? [] }));

    return jsonOk({ comments: withReplies, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    return handleApiError(err);
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id) return jsonError('Missing id', 400);

    const limited = rateLimit(`comment:${String(locals.user._id)}`, 30, 10 * 60 * 1000);
    if (!limited.allowed) return jsonError('You are commenting too fast. Please slow down.', 429);

    const body = await request.json().catch(() => null);
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);

    await connectToDatabase();
    const blog = await Blog.findById(params.id);
    if (!blog || blog.status !== 'published') return jsonError('Blog not found', 404);

    if (await isBlockedEitherWay(String(locals.user._id), String(blog.author))) {
      return jsonError('Blog not found', 404);
    }

    let parentComment = null;
    if (parsed.data.parent) {
      parentComment = await Comment.findOne({ _id: parsed.data.parent, blog: blog._id, deleted: false });
      if (!parentComment) return jsonError('Parent comment not found', 404);
    }

    const comment = await Comment.create({
      blog: blog._id,
      author: locals.user._id,
      parent: parentComment ? parentComment._id : null,
      content: parsed.data.content,
    });

    await Blog.updateOne({ _id: blog._id }, { $inc: { commentsCount: 1 } });
    await comment.populate('author', 'username name avatarUrl');

    if (parentComment) {
      await createNotification({
        recipient: parentComment.author,
        actor: locals.user._id,
        type: 'reply',
        blog: blog._id,
        comment: comment._id,
      });
    } else {
      await createNotification({
        recipient: blog.author,
        actor: locals.user._id,
        type: 'comment',
        blog: blog._id,
        comment: comment._id,
      });
    }

    return jsonOk({ comment }, 201);
  } catch (err) {
    return handleApiError(err);
  }
};
