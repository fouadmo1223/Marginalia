import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Blog } from '../../../../models/Blog';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonOk, handleApiError } from '../../../../lib/api-response';
import { buildPaginationMeta } from '../../../../lib/pagination';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  status: z.enum(['draft', 'published']).optional(),
  author: z.string().optional(),
  category: z.string().optional(),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    requireAdmin(locals.user);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonOk({ blogs: [], pagination: buildPaginationMeta(1, 20, 0) });

    const { page, limit, q, status, author, category } = parsed.data;
    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (author) filter.author = author;
    if (category) filter.categories = category;
    if (q) filter.title = { $regex: q, $options: 'i' };

    const total = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username name avatarUrl')
      .lean();

    return jsonOk({ blogs, pagination: buildPaginationMeta(page, limit, total) });
  } catch (err) {
    return handleApiError(err);
  }
};
