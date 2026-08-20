import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { Tag } from '../../../models/Tag';
import { jsonOk, handleApiError } from '../../../lib/api-response';
import { z } from 'zod';

export const prerender = false;

const querySchema = z.object({ q: z.string().trim().optional(), limit: z.coerce.number().int().min(1).max(50).default(20) });

export const GET: APIRoute = async ({ url }) => {
  try {
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    const { q, limit } = parsed.success ? parsed.data : { q: undefined, limit: 20 };

    await connectToDatabase();
    const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
    const tags = await Tag.find(filter).sort({ usageCount: -1 }).limit(limit).lean();

    return jsonOk({ tags });
  } catch (err) {
    return handleApiError(err);
  }
};
