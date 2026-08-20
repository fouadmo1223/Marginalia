import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { User } from '../../../../models/User';
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
  status: z.enum(['active', 'disabled']).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    requireAdmin(locals.user);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonOk({ users: [], pagination: buildPaginationMeta(1, 20, 0) });

    const { page, limit, q, status, role } = parsed.data;
    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (q) {
      filter.$or = [
        { usernameLower: { $regex: q.toLowerCase(), $options: 'i' } },
        { emailLower: { $regex: q.toLowerCase(), $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const blogCounts = await Blog.aggregate([
      { $match: { author: { $in: users.map((u) => u._id) } } },
      { $group: { _id: '$author', count: { $sum: 1 } } },
    ]);
    const countByAuthor = new Map(blogCounts.map((b) => [String(b._id), b.count]));
    const usersWithCounts = users.map((u) => ({ ...u, blogsCount: countByAuthor.get(String(u._id)) ?? 0 }));

    return jsonOk({ users: usersWithCounts, pagination: buildPaginationMeta(page, limit, total) });
  } catch (err) {
    return handleApiError(err);
  }
};
