import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Tag } from '../../../../models/Tag';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { tagSchema } from '../../../../lib/validation/blog';
import { slugify } from '../../../../lib/slugify';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    requireAdmin(locals.user);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    const { q, page, limit } = parsed.success ? parsed.data : { q: undefined, page: 1, limit: 30 };

    await connectToDatabase();
    const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
    const total = await Tag.countDocuments(filter);
    const tags = await Tag.find(filter)
      .sort({ usageCount: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return jsonOk({ tags, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    return handleApiError(err);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    requireAdmin(locals.user);
    const body = await request.json().catch(() => null);
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) return jsonError('Invalid input', 422);

    await connectToDatabase();
    const slug = slugify(parsed.data.name);
    const exists = await Tag.findOne({ slug });
    if (exists) return jsonError('This tag already exists', 409);

    const tag = await Tag.create({ name: parsed.data.name, slug });
    return jsonOk({ tag }, 201);
  } catch (err) {
    return handleApiError(err);
  }
};
