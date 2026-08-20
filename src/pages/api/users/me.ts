import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';
import { updateProfileSchema } from '../../../lib/validation/auth';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';

export const prerender = false;

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);

    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);

    await connectToDatabase();
    const update: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) update.name = parsed.data.name;
    if (parsed.data.bio !== undefined) update.bio = parsed.data.bio;

    const user = await User.findByIdAndUpdate(locals.user._id, update, { new: true });
    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
};
