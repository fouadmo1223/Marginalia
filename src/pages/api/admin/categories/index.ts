import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Category } from '../../../../models/Category';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { categorySchema } from '../../../../lib/validation/blog';
import { slugify } from '../../../../lib/slugify';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    requireAdmin(locals.user);
    await connectToDatabase();
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    return jsonOk({ categories });
  } catch (err) {
    return handleApiError(err);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    requireAdmin(locals.user);
    const body = await request.json().catch(() => null);
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);

    await connectToDatabase();
    const slug = slugify(parsed.data.name);
    const exists = await Category.findOne({ slug });
    if (exists) return jsonError('A category with this name already exists', 409);

    const category = await Category.create({ ...parsed.data, slug });
    return jsonOk({ category }, 201);
  } catch (err) {
    return handleApiError(err);
  }
};
