import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Category } from '../../../../models/Category';
import { Blog } from '../../../../models/Blog';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { categorySchema } from '../../../../lib/validation/blog';
import { slugify } from '../../../../lib/slugify';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    const body = await request.json().catch(() => null);
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) return jsonError('Invalid input', 422);

    await connectToDatabase();
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.name) update.slug = slugify(parsed.data.name);

    const category = await Category.findByIdAndUpdate(params.id, update, { new: true });
    if (!category) return jsonError('Category not found', 404);

    return jsonOk({ category });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    await Blog.updateMany({ categories: params.id }, { $pull: { categories: params.id } });
    const category = await Category.findByIdAndDelete(params.id);
    if (!category) return jsonError('Category not found', 404);

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
};
