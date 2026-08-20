import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { User } from '../../../../models/User';
import { Blog } from '../../../../models/Blog';
import { Follow } from '../../../../models/Follow';
import { Block } from '../../../../models/Block';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    if (!params.username) return jsonError('Missing username', 400);
    await connectToDatabase();

    const user = await User.findOne({ usernameLower: params.username.toLowerCase() });
    if (!user || user.status === 'disabled') return jsonError('User not found', 404);

    const blogsCount = await Blog.countDocuments({ author: user._id, status: 'published' });

    let relationship = { isFollowing: false, isBlocked: false, isBlockedBy: false, isSelf: false };
    if (locals.user) {
      const isSelf = String(locals.user._id) === String(user._id);
      const [isFollowing, blockedByMe, blockedByThem] = await Promise.all([
        isSelf ? false : Follow.exists({ follower: locals.user._id, following: user._id }),
        isSelf ? false : Block.exists({ blocker: locals.user._id, blocked: user._id }),
        isSelf ? false : Block.exists({ blocker: user._id, blocked: locals.user._id }),
      ]);
      relationship = {
        isFollowing: Boolean(isFollowing),
        isBlocked: Boolean(blockedByMe),
        isBlockedBy: Boolean(blockedByThem),
        isSelf,
      };
    }

    if (relationship.isBlockedBy && locals.user?.role !== 'admin') {
      return jsonError('User not found', 404);
    }

    return jsonOk({
      user: {
        id: String(user._id),
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        blogsCount,
        createdAt: user.createdAt,
      },
      relationship,
    });
  } catch (err) {
    return handleApiError(err);
  }
};
