import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Tag } from '../../../../models/Tag';
import { Blog } from '../../../../models/Blog';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { tagSchema } from '../../../../lib/validation/blog';
import { slugify } from '../../../../lib/slugify';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    const body = await request.json().catch(() => null);
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) return jsonError('Invalid input', 422);

    await connectToDatabase();
    const tag = await Tag.findByIdAndUpdate(
      params.id,
      { name: parsed.data.name, slug: slugify(parsed.data.name) },
      { new: true },
    );
    if (!tag) return jsonError('Tag not found', 404);

    return jsonOk({ tag });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    await Blog.updateMany({ tags: params.id }, { $pull: { tags: params.id } });
    const tag = await Tag.findByIdAndDelete(params.id);
    if (!tag) return jsonError('Tag not found', 404);

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
};
