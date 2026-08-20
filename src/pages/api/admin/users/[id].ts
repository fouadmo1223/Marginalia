import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { User } from '../../../../models/User';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { destroyAllSessions } from '../../../../lib/session';
import { deleteUserCascade } from '../../../../lib/user-cascade';
import { z } from 'zod';

export const prerender = false;

const patchSchema = z.object({
  status: z.enum(['active', 'disabled']).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);
    if (params.id === String(locals.user!._id)) {
      return jsonError('You cannot modify your own admin account here', 400);
    }

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return jsonError('Invalid input', 422);

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(params.id, parsed.data, { new: true });
    if (!user) return jsonError('User not found', 404);

    if (parsed.data.status === 'disabled') {
      await destroyAllSessions(String(user._id));
    }

    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);
    if (params.id === String(locals.user!._id)) {
      return jsonError('You cannot delete your own admin account', 400);
    }

    await connectToDatabase();
    const exists = await User.exists({ _id: params.id });
    if (!exists) return jsonError('User not found', 404);

    // Cascades to the user's blogs, comments, likes, follows, blocks,
    // notifications, reports, sessions, and Cloudinary assets.
    await deleteUserCascade(params.id);

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
};
