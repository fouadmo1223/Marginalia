import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Like } from '../../../../models/Like';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Lists the users who liked a blog — used for the "who liked this" view.
export const GET: APIRoute = async ({ params, url }) => {
  try {
    if (!params.id) return jsonError('Missing id', 400);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonError('Invalid query', 422);
    const { page, limit } = parsed.data;

    await connectToDatabase();

    const likes = await Like.find({ blog: params.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username name avatarUrl bio')
      .lean();

    return jsonOk({ users: likes.map((l) => l.user) });
  } catch (err) {
    return handleApiError(err);
  }
};
