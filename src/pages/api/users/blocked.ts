import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { Block } from '../../../models/Block';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';

export const prerender = false;

// The caller's own block list — never exposed for other users.
export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    await connectToDatabase();

    const blocks = await Block.find({ blocker: locals.user._id })
      .sort({ createdAt: -1 })
      .populate('blocked', 'username name avatarUrl bio')
      .lean();

    return jsonOk({ users: blocks.map((b) => b.blocked) });
  } catch (err) {
    return handleApiError(err);
  }
};
