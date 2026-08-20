import type { APIRoute } from 'astro';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../../../lib/db';
import { User } from '../../../../models/User';
import { Follow } from '../../../../models/Follow';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { createNotification } from '../../../../lib/notify';
import { isBlockedEitherWay } from '../../../../lib/social';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id || !mongoose.isValidObjectId(params.id)) return jsonError('Invalid user id', 400);
    if (params.id === String(locals.user._id)) return jsonError('You cannot follow yourself', 400);

    await connectToDatabase();
    const target = await User.findById(params.id);
    if (!target || target.status === 'disabled') return jsonError('User not found', 404);

    if (await isBlockedEitherWay(String(locals.user._id), params.id)) {
      return jsonError('Unable to follow this user', 403);
    }

    try {
      await Follow.create({ follower: locals.user._id, following: target._id });
    } catch (err: any) {
      if (err?.code === 11000) return jsonOk({ following: true });
      throw err;
    }

    await Promise.all([
      User.updateOne({ _id: locals.user._id }, { $inc: { followingCount: 1 } }),
      User.updateOne({ _id: target._id }, { $inc: { followersCount: 1 } }),
    ]);

    await createNotification({ recipient: target._id, actor: locals.user._id, type: 'follow' });

    return jsonOk({ following: true });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id || !mongoose.isValidObjectId(params.id)) return jsonError('Invalid user id', 400);

    await connectToDatabase();
    const result = await Follow.deleteOne({ follower: locals.user._id, following: params.id });

    if (result.deletedCount > 0) {
      await Promise.all([
        User.updateOne({ _id: locals.user._id }, { $inc: { followingCount: -1 } }),
        User.updateOne({ _id: params.id }, { $inc: { followersCount: -1 } }),
      ]);
    }

    return jsonOk({ following: false });
  } catch (err) {
    return handleApiError(err);
  }
};
