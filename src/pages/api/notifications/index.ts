import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { Notification } from '../../../models/Notification';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { buildPaginationMeta } from '../../../lib/pagination';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonError('Invalid query', 422);
    const { page, limit } = parsed.data;

    await connectToDatabase();

    const filter = { recipient: locals.user._id };
    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('actor', 'username name avatarUrl')
        .populate('blog', 'title slug')
        .lean(),
    ]);

    return jsonOk({ notifications, unreadCount, pagination: buildPaginationMeta(page, limit, total) });
  } catch (err) {
    return handleApiError(err);
  }
};
