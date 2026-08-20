import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { Report } from '../../../models/Report';
import { User } from '../../../models/User';
import { Blog } from '../../../models/Blog';
import { Comment } from '../../../models/Comment';
import { reportSchema } from '../../../lib/validation/blog';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { rateLimit } from '../../../lib/rate-limit';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) return jsonError('Authentication required', 401);

    const limited = rateLimit(`report:${String(locals.user._id)}`, 20, 60 * 60 * 1000);
    if (!limited.allowed) return jsonError('Too many reports submitted. Please try again later.', 429);

    const body = await request.json().catch(() => null);
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);

    await connectToDatabase();

    const { targetType, targetId } = parsed.data;
    const Model: typeof User | typeof Blog | typeof Comment =
      targetType === 'user' ? User : targetType === 'blog' ? Blog : Comment;
    const exists = await (Model as typeof User).exists({ _id: targetId });
    if (!exists) return jsonError('Report target not found', 404);

    const report = await Report.create({
      reporter: locals.user._id,
      targetType,
      targetId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });

    return jsonOk({ report }, 201);
  } catch (err) {
    return handleApiError(err);
  }
};
