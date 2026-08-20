import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../lib/db';
import { Blog } from '../../models/Blog';
import { getExcludedUserIds, getFollowingIds } from '../../lib/social';
import { jsonError, jsonOk, handleApiError } from '../../lib/api-response';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({ tab: z.enum(['following', 'recent', 'popular']).default('recent') });

// Powers client-side tab switching on the homepage feed — mirrors the same logic
// index.astro uses for its first server-rendered paint, so switching tabs never
// needs a full page reload.
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonError('Invalid query', 422);
    const { tab } = parsed.data;

    const user = locals.user;
    await connectToDatabase();

    const excluded = await getExcludedUserIds(user ? String(user._id) : null);
    const filter: Record<string, unknown> = { status: 'published' };
    if (excluded.length) filter.author = { $nin: excluded };

    let sort: Record<string, 1 | -1> = { publishedAt: -1 };
    let emptyFollowing = false;

    if (tab === 'following') {
      if (!user) return jsonError('Authentication required', 401);
      const followingIds = await getFollowingIds(String(user._id));
      if (followingIds.length === 0) {
        emptyFollowing = true;
      } else {
        filter.author = excluded.length
          ? { $in: followingIds.filter((id) => !excluded.includes(id)) }
          : { $in: followingIds };
      }
    } else if (tab === 'popular') {
      sort = { likesCount: -1, publishedAt: -1 };
    }

    const blogs = emptyFollowing
      ? []
      : await Blog.find(filter).sort(sort).limit(20).populate('author', 'username name avatarUrl').lean();

    return jsonOk({ blogs, emptyFollowing });
  } catch (err) {
    return handleApiError(err);
  }
};
