import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Comment } from '../../../../models/Comment';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonOk, handleApiError } from '../../../../lib/api-response';
import { buildPaginationMeta } from '../../../../lib/pagination';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  blog: z.string().optional(),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    requireAdmin(locals.user);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonOk({ comments: [], pagination: buildPaginationMeta(1, 20, 0) });

    const { page, limit, q, blog } = parsed.data;
    await connectToDatabase();

    const filter: Record<string, unknown> = { deleted: false };
    if (blog) filter.blog = blog;
    if (q) filter.content = { $regex: q, $options: 'i' };

    const total = await Comment.countDocuments(filter);
    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username name avatarUrl')
      .populate('blog', 'title slug')
      .lean();

    return jsonOk({ comments, pagination: buildPaginationMeta(page, limit, total) });
  } catch (err) {
    return handleApiError(err);
  }
};
