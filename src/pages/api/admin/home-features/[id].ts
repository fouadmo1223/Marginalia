import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { HomeFeature } from '../../../../models/HomeFeature';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const feature = await HomeFeature.findByIdAndDelete(params.id);
    if (!feature) return jsonError('Feature not found', 404);

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
};
