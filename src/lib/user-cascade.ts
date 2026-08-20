import { User } from '../models/User';
import { Blog } from '../models/Blog';
import { Comment } from '../models/Comment';
import { Like } from '../models/Like';
import { Follow } from '../models/Follow';
import { Block } from '../models/Block';
import { Notification } from '../models/Notification';
import { Report } from '../models/Report';
import { Session } from '../models/Session';
import { deleteImage } from './cloudinary';

/**
 * Permanently removes a user and every trace of their activity: their blogs (and
 * those blogs' comments/likes/images), their comments and likes on other people's
 * blogs, follows and blocks in both directions, notifications where they're either
 * side, reports they filed or were the target of, sessions, and their avatar.
 * Irreversible — callers must confirm with an admin before invoking this.
 */
export async function deleteUserCascade(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  // 1. The user's own blogs: clean up Cloudinary assets, then dependent comments/likes.
  const ownBlogs = await Blog.find({ author: userId }).select('_id coverImage images').lean();
  const ownBlogIds = ownBlogs.map((b) => b._id);

  const imagesToDelete = ownBlogs.flatMap((b) => [b.coverImage, ...(b.images ?? [])]).filter(Boolean) as {
    publicId: string;
  }[];
  await Promise.all(imagesToDelete.map((img) => deleteImage(img.publicId).catch(() => null)));

  if (ownBlogIds.length) {
    await Comment.deleteMany({ blog: { $in: ownBlogIds } });
    await Like.deleteMany({ blog: { $in: ownBlogIds } });
    await Blog.deleteMany({ _id: { $in: ownBlogIds } });
  }

  // 2. The user's comments on other people's blogs — decrement those blogs' counts.
  const ownComments = await Comment.find({ author: userId }).select('blog').lean();
  const commentCountByBlog = new Map<string, number>();
  for (const c of ownComments) {
    const key = String(c.blog);
    commentCountByBlog.set(key, (commentCountByBlog.get(key) ?? 0) + 1);
  }
  await Promise.all(
    Array.from(commentCountByBlog.entries()).map(([blogId, count]) =>
      Blog.updateOne({ _id: blogId }, { $inc: { commentsCount: -count } }),
    ),
  );
  await Comment.deleteMany({ author: userId });

  // 3. The user's likes on other people's blogs.
  const ownLikes = await Like.find({ user: userId }).select('blog').lean();
  const likeCountByBlog = new Map<string, number>();
  for (const l of ownLikes) {
    const key = String(l.blog);
    likeCountByBlog.set(key, (likeCountByBlog.get(key) ?? 0) + 1);
  }
  await Promise.all(
    Array.from(likeCountByBlog.entries()).map(([blogId, count]) =>
      Blog.updateOne({ _id: blogId }, { $inc: { likesCount: -count } }),
    ),
  );
  await Like.deleteMany({ user: userId });

  // 4. Follows in both directions — decrement the other side's counters.
  const followingDocs = await Follow.find({ follower: userId }).select('following').lean();
  const followerDocs = await Follow.find({ following: userId }).select('follower').lean();
  await Promise.all(followingDocs.map((f) => User.updateOne({ _id: f.following }, { $inc: { followersCount: -1 } })));
  await Promise.all(followerDocs.map((f) => User.updateOne({ _id: f.follower }, { $inc: { followingCount: -1 } })));
  await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });

  // 5. Blocks in both directions.
  await Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] });

  // 6. Notifications where the user is either the recipient or the actor.
  await Notification.deleteMany({ $or: [{ recipient: userId }, { actor: userId }] });

  // 7. Reports the user filed, and reports filed against them as a user.
  await Report.deleteMany({ $or: [{ reporter: userId }, { targetType: 'user', targetId: userId }] });

  // 8. Sessions and avatar.
  await Session.deleteMany({ userId });
  if (user.avatarPublicId) {
    await deleteImage(user.avatarPublicId).catch(() => null);
  }

  // 9. The user document itself.
  await User.deleteOne({ _id: userId });
}
