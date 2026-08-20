import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { Report } from '../../../../models/Report';
import { requireAdmin } from '../../../../lib/admin-guard';
import { jsonOk, handleApiError } from '../../../../lib/api-response';
import { buildPaginationMeta } from '../../../../lib/pagination';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED']).optional(),
  targetType: z.enum(['user', 'blog', 'comment']).optional(),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    requireAdmin(locals.user);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonOk({ reports: [], pagination: buildPaginationMeta(1, 20, 0) });

    const { page, limit, status, targetType } = parsed.data;
    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reporter', 'username name avatarUrl')
      .populate('reviewedBy', 'username name')
      .lean();

    return jsonOk({ reports, pagination: buildPaginationMeta(page, limit, total) });
  } catch (err) {
    return handleApiError(err);
  }
};
