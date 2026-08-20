import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { User } from '../../../../models/User';
import { Blog } from '../../../../models/Blog';
import { Comment } from '../../../../models/Comment';
import { Like } from '../../../../models/Like';
import { Report } from '../../../../models/Report';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonOk, handleApiError } from '../../../../lib/api-response';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    requireAdmin(locals.user);
    await connectToDatabase();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      activeUsers,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalComments,
      totalLikes,
      viewsAgg,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ updatedAt: { $gte: sevenDaysAgo }, status: 'active' }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Comment.countDocuments({ deleted: false }),
      Like.countDocuments(),
      Blog.aggregate([{ $group: { _id: null, total: { $sum: '$viewsCount' } } }]),
      Report.countDocuments({ status: 'PENDING' }),
    ]);

    const signupsByDay = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const blogsByDay = await Blog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return jsonOk({
      stats: {
        totalUsers,
        newUsers,
        activeUsers,
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalComments,
        totalLikes,
        totalViews: viewsAgg[0]?.total ?? 0,
        pendingReports,
      },
      charts: { signupsByDay, blogsByDay },
    });
  } catch (err) {
    return handleApiError(err);
  }
};
