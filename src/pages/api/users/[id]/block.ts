import type { APIRoute } from 'astro';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../../../lib/db';
import { User } from '../../../../models/User';
import { Block } from '../../../../models/Block';
import { Follow } from '../../../../models/Follow';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id || !mongoose.isValidObjectId(params.id)) return jsonError('Invalid user id', 400);
    if (params.id === String(locals.user._id)) return jsonError('You cannot block yourself', 400);

    await connectToDatabase();
    const target = await User.findById(params.id);
    if (!target) return jsonError('User not found', 404);

    try {
      await Block.create({ blocker: locals.user._id, blocked: target._id });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }

    // Blocking severs any existing follow relationship in both directions.
    const [meFollowsThem, theyFollowMe] = await Promise.all([
      Follow.findOneAndDelete({ follower: locals.user._id, following: target._id }),
      Follow.findOneAndDelete({ follower: target._id, following: locals.user._id }),
    ]);

    if (meFollowsThem) {
      await Promise.all([
        User.updateOne({ _id: locals.user._id }, { $inc: { followingCount: -1 } }),
        User.updateOne({ _id: target._id }, { $inc: { followersCount: -1 } }),
      ]);
    }
    if (theyFollowMe) {
      await Promise.all([
        User.updateOne({ _id: target._id }, { $inc: { followingCount: -1 } }),
        User.updateOne({ _id: locals.user._id }, { $inc: { followersCount: -1 } }),
      ]);
    }

    return jsonOk({ blocked: true });
  } catch (err) {
    return handleApiError(err);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);
    if (!params.id || !mongoose.isValidObjectId(params.id)) return jsonError('Invalid user id', 400);

    await connectToDatabase();
    await Block.deleteOne({ blocker: locals.user._id, blocked: params.id });

    return jsonOk({ blocked: false });
  } catch (err) {
    return handleApiError(err);
  }
};
