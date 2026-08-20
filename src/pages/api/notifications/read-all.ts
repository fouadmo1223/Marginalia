import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { Notification } from '../../../models/Notification';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    await connectToDatabase();
    await Notification.updateMany({ recipient: locals.user._id, read: false }, { read: true });
    return jsonOk({ read: true });
  } catch (err) {
    return handleApiError(err);
  }
};
