import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { Category } from '../../../models/Category';
import { jsonOk, handleApiError } from '../../../lib/api-response';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    await connectToDatabase();
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    return jsonOk({ categories });
  } catch (err) {
    return handleApiError(err);
  }
};
