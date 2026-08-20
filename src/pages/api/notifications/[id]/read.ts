import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Notification } from '../../../../models/Notification';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    await Notification.updateOne({ _id: params.id, recipient: locals.user._id }, { read: true });

    return jsonOk({ read: true });
  } catch (err) {
    return handleApiError(err);
  }
};
