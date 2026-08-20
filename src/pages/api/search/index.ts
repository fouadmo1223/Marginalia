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
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(100).optional(),
  type: z.enum(['all', 'blogs', 'users', 'tags', 'categories']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonOk({ blogs: [], users: [], tags: [], categories: [] });

    const { q, category, tag, type, page, limit } = parsed.data;
    // Browsing by category/tag slug is a distinct mode from free-text search —
    // no query string is required for it, unlike the text-search paths below.
    if (!q && !category && !tag) return jsonOk({ blogs: [], users: [], tags: [], categories: [] });

    await connectToDatabase();

    const excluded = await getExcludedUserIds(locals.user ? String(locals.user._id) : null);
    const skip = (page - 1) * limit;

    let blogs: any[] = [];
    let activeCategory: any = null;
    let activeTag: any = null;

    if (category || tag) {
      const blogFilter: Record<string, unknown> = {
        status: 'published',
        ...(excluded.length ? { author: { $nin: excluded } } : {}),
      };
      if (category) {
        activeCategory = await Category.findOne({ slug: category }).lean();
        if (!activeCategory) return jsonOk({ blogs: [], users: [], tags: [], categories: [] });
        blogFilter.categories = activeCategory._id;
      }
      if (tag) {
        activeTag = await Tag.findOne({ slug: tag }).lean();
        if (!activeTag) return jsonOk({ blogs: [], users: [], tags: [], categories: [] });
        blogFilter.tags = activeTag._id;
      }
      blogs = await Blog.find(blogFilter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name avatarUrl')
        .lean();

      return jsonOk({ blogs, users: [], tags: [], categories: [], activeCategory, activeTag });
    }

    // Regex substring matching rather than $text: MongoDB's $text index only matches
    // whole (stemmed) words, so a short or partial query like "d" never matches
    // "Devon" — it needs to behave like typeahead, not whole-word search.
    const pattern = q!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = { $regex: pattern, $options: 'i' };

    const [searchedBlogs, users, tags, categories] = await Promise.all([
      type === 'all' || type === 'blogs'
        ? Blog.find({
            $or: [{ title: rx }, { excerpt: rx }],
            status: 'published',
            ...(excluded.length ? { author: { $nin: excluded } } : {}),
          })
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username name avatarUrl')
            .lean()
        : [],
      type === 'all' || type === 'users'
        ? User.find({
            $or: [{ name: rx }, { username: rx }],
            status: 'active',
            ...(excluded.length ? { _id: { $nin: excluded } } : {}),
          })
            .skip(skip)
            .limit(limit)
            .select('username name avatarUrl bio followersCount')
            .lean()
        : [],
      type === 'all' || type === 'tags'
        ? Tag.find({ name: { $regex: q!, $options: 'i' } }).sort({ usageCount: -1 }).limit(limit).lean()
        : [],
      type === 'all' || type === 'categories'
        ? Category.find({ name: { $regex: q!, $options: 'i' } }).limit(limit).lean()
        : [],
    ]);

    return jsonOk({ blogs: searchedBlogs, users, tags, categories });
  } catch (err) {
    return handleApiError(err);
  }
};
