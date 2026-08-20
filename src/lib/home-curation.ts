import { HomeFeature, type HomeSection } from '../models/HomeFeature';

/** Ordered list of blog ids an admin has pinned to a homepage section, if any. */
export async function getCuratedBlogIds(section: HomeSection): Promise<string[]> {
  const entries = await HomeFeature.find({ section }).sort({ order: 1 }).select('blog').lean();
  return entries.map((e) => String(e.blog));
}

/** Reorders a populated blog list to match a curated id order (curated ids not found are dropped). */
export function sortByCuratedOrder<T extends { _id: unknown }>(blogs: T[], orderedIds: string[]): T[] {
  const byId = new Map(blogs.map((b) => [String(b._id), b]));
  return orderedIds.map((id) => byId.get(id)).filter((b): b is T => Boolean(b));
}
