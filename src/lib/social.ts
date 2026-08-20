import { Block } from '../models/Block';
import { Follow } from '../models/Follow';
import type { Types } from 'mongoose';

/**
 * Returns the set of user ids that should be excluded from `userId`'s view:
 * everyone `userId` has blocked, and everyone who has blocked `userId`.
 * Must be applied server-side to every feed/search/profile query — never
 * enforced only on the client.
 */
export async function getExcludedUserIds(userId: string | Types.ObjectId | null): Promise<string[]> {
  if (!userId) return [];

  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  })
    .select('blocker blocked')
    .lean();

  const excluded = new Set<string>();
  for (const b of blocks) {
    excluded.add(String(b.blocker));
    excluded.add(String(b.blocked));
  }
  excluded.delete(String(userId));
  return Array.from(excluded);
}

export async function isBlockedEitherWay(userA: string, userB: string): Promise<boolean> {
  if (userA === userB) return false;
  const block = await Block.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  }).lean();
  return Boolean(block);
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const follows = await Follow.find({ follower: userId }).select('following').lean();
  return follows.map((f) => String(f.following));
}
