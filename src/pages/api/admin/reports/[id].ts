import type { APIRoute } from 'astro';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../../../lib/db';
import { Report } from '../../../../models/Report';
import { User } from '../../../../models/User';
import { Blog } from '../../../../models/Blog';
import { Comment } from '../../../../models/Comment';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonError, jsonOk, handleApiError } from '../../../../lib/api-response';
import { destroyAllSessions } from '../../../../lib/session';
import { z } from 'zod';

export const prerender = false;

const patchSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED']),
  action: z.enum(['none', 'delete_content', 'disable_user']).optional().default('none'),
});

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    await connectToDatabase();
    const report = await Report.findById(params.id).populate('reporter', 'username name avatarUrl').lean();
    if (!report) return jsonError('Report not found', 404);

    let target: unknown = null;
    if (mongoose.isValidObjectId(report.targetId)) {
      if (report.targetType === 'user') target = await User.findById(report.targetId).lean();
      if (report.targetType === 'blog') target = await Blog.findById(report.targetId).populate('author', 'username name').lean();
      if (report.targetType === 'comment') target = await Comment.findById(report.targetId).populate('author', 'username name').lean();
    }

    return jsonOk({ report, target });
  } catch (err) {
    return handleApiError(err);
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    requireAdmin(locals.user);
    if (!params.id) return jsonError('Missing id', 400);

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return jsonError('Invalid input', 422);

    await connectToDatabase();
    const report = await Report.findById(params.id);
    if (!report) return jsonError('Report not found', 404);

    if (parsed.data.action === 'delete_content') {
      if (report.targetType === 'blog') await Blog.findByIdAndDelete(report.targetId);
      if (report.targetType === 'comment') {
        await Comment.findByIdAndUpdate(report.targetId, { deleted: true, content: '[removed by moderator]' });
      }
    }
    if (parsed.data.action === 'disable_user') {
      const targetUserId = report.targetType === 'user' ? report.targetId : null;
      if (targetUserId) {
        await User.findByIdAndUpdate(targetUserId, { status: 'disabled' });
        await destroyAllSessions(String(targetUserId));
      }
    }

    report.status = parsed.data.status;
    report.reviewedBy = locals.user!._id as any;
    report.reviewedAt = new Date();
    await report.save();

    return jsonOk({ report });
  } catch (err) {
    return handleApiError(err);
  }
};
