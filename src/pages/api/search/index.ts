import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { Blog } from '../../../models/Blog';
import { User } from '../../../models/User';
import { Tag } from '../../../models/Tag';
import { Category } from '../../../models/Category';
import { jsonOk, handleApiError } from '../../../lib/api-response';
import { getExcludedUserIds } from '../../../lib/social';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  q: z.string().trim().min(1).max(200),
  type: z.enum(['all', 'blogs', 'users', 'tags', 'categories']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonOk({ blogs: [], users: [], tags: [], categories: [] });

    const { q, type, page, limit } = parsed.data;
    await connectToDatabase();

    const excluded = await getExcludedUserIds(locals.user ? String(locals.user._id) : null);
    const skip = (page - 1) * limit;

    const [blogs, users, tags, categories] = await Promise.all([
      type === 'all' || type === 'blogs'
        ? Blog.find({ $text: { $search: q }, status: 'published', ...(excluded.length ? { author: { $nin: excluded } } : {}) })
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username name avatarUrl')
            .lean()
        : [],
      type === 'all' || type === 'users'
        ? User.find({
            $text: { $search: q },
            status: 'active',
            ...(excluded.length ? { _id: { $nin: excluded } } : {}),
          })
            .skip(skip)
            .limit(limit)
            .select('username name avatarUrl bio followersCount')
            .lean()
        : [],
      type === 'all' || type === 'tags'
        ? Tag.find({ name: { $regex: q, $options: 'i' } }).sort({ usageCount: -1 }).limit(limit).lean()
        : [],
      type === 'all' || type === 'categories'
        ? Category.find({ name: { $regex: q, $options: 'i' } }).limit(limit).lean()
        : [],
    ]);

    return jsonOk({ blogs, users, tags, categories });
  } catch (err) {
    return handleApiError(err);
  }
};
