import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { User } from '../../../../models/User';
import { Follow } from '../../../../models/Follow';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET: APIRoute = async ({ params, url }) => {
  try {
    if (!params.username) return jsonError('Missing username', 400);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonError('Invalid query', 422);

    await connectToDatabase();
    const user = await User.findOne({ usernameLower: params.username.toLowerCase() }).lean();
    if (!user) return jsonError('User not found', 404);

    const { page, limit } = parsed.data;
    const follows = await Follow.find({ follower: user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('following', 'username name avatarUrl bio')
      .lean();

    return jsonOk({ users: follows.map((f) => f.following) });
  } catch (err) {
    return handleApiError(err);
  }
};
