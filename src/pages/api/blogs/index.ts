import type { APIRoute } from 'astro';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../../lib/db';
import { Blog } from '../../../models/Blog';
import { Tag } from '../../../models/Tag';
import { createBlogSchema, listBlogsQuerySchema } from '../../../lib/validation/blog';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { uniqueSlug } from '../../../lib/slugify';
import { getExcludedUserIds } from '../../../lib/social';
import { buildPaginationMeta } from '../../../lib/pagination';
import { rateLimit } from '../../../lib/rate-limit';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const parsed = listBlogsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonError('Invalid query', 422);
    const { page, limit, status, author, category, tag, q } = parsed.data;

    await connectToDatabase();

    const filter: Record<string, unknown> = {};

    if (author) {
      filter.author = author;
      // Owner (or admin) may view their own drafts; everyone else only sees published.
      const isOwner = locals.user && String(locals.user._id) === author;
      const isAdmin = locals.user?.role === 'admin';
      if (!isOwner && !isAdmin) {
        filter.status = 'published';
      } else if (status && status !== 'all') {
        filter.status = status;
      }
    } else {
      filter.status = 'published';
    }

    if (category) filter.categories = category;
    if (tag) {
      const tagDoc = await Tag.findOne({ slug: tag }).lean();
      filter.tags = tagDoc ? tagDoc._id : new mongoose.Types.ObjectId();
    }
    if (q) filter.$text = { $search: q };

    const excluded = await getExcludedUserIds(locals.user ? String(locals.user._id) : null);
    if (excluded.length) filter.author = filter.author ? filter.author : { $nin: excluded };

    const total = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .sort(q ? { score: { $meta: 'textScore' } } : { publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username name avatarUrl')
      .populate('categories', 'name slug')
      .lean();

    return jsonOk({ blogs, pagination: buildPaginationMeta(page, limit, total) });
  } catch (err) {
    return handleApiError(err);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);

    const limited = rateLimit(`create-blog:${String(locals.user._id)}`, 20, 60 * 60 * 1000);
    if (!limited.allowed) return jsonError('Too many blogs created. Slow down.', 429);

    const body = await request.json().catch(() => null);
    const parsed = createBlogSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);

    await connectToDatabase();

    const { title, excerpt, content, categories, tags, status, coverImage } = parsed.data;

    const tagIds = await resolveTagIds(tags);

    const blog = await Blog.create({
      title,
      slug: uniqueSlug(title),
      excerpt,
      content,
      categories,
      tags: tagIds,
      status,
      coverImage: coverImage ?? null,
      publishedAt: status === 'published' ? new Date() : null,
      author: locals.user._id,
    });

    return jsonOk({ blog }, 201);
  } catch (err) {
    return handleApiError(err);
  }
};

async function resolveTagIds(names: string[]): Promise<mongoose.Types.ObjectId[]> {
  const ids: mongoose.Types.ObjectId[] = [];
  for (const name of names) {
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').slice(0, 40);
    if (!slug) continue;
    const tag = await Tag.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug }, $inc: { usageCount: 1 } },
      { upsert: true, new: true },
    );
    ids.push(tag._id as mongoose.Types.ObjectId);
  }
  return ids;
}
