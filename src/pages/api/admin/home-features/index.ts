import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { HomeFeature } from '../../../../models/HomeFeature';
import { Blog } from '../../../../models/Blog';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { z } from 'zod';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    requireAdmin(locals.user);
    await connectToDatabase();

    const features = await HomeFeature.find()
      .sort({ section: 1, order: 1 })
      .populate({
        path: 'blog',
        select: 'title slug status coverImage author',
        populate: { path: 'author', select: 'username name' },
      })
      .lean();

    return jsonOk({ features });
  } catch (err) {
    return handleApiError(err);
  }
};

const createSchema = z.object({
  section: z.enum(['featured', 'trending', 'gallery']),
  blogId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid blog id'),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    requireAdmin(locals.user);
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);

    await connectToDatabase();
    const blog = await Blog.exists({ _id: parsed.data.blogId });
    if (!blog) return jsonError('Blog not found', 404);

    // Featured is a single slot — replace whatever was there before.
    if (parsed.data.section === 'featured') {
      await HomeFeature.deleteMany({ section: 'featured' });
    }

    const maxOrder = await HomeFeature.findOne({ section: parsed.data.section }).sort({ order: -1 }).lean();

    try {
      const feature = await HomeFeature.create({
        section: parsed.data.section,
        blog: parsed.data.blogId,
        order: (maxOrder?.order ?? -1) + 1,
      });
      return jsonOk({ feature }, 201);
    } catch (err: any) {
      if (err?.code === 11000) return jsonError('This blog is already featured in this section', 409);
      throw err;
    }
  } catch (err) {
    return handleApiError(err);
  }
};
