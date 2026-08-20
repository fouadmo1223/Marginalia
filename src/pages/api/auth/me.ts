import type { APIRoute } from 'astro';
import { jsonOk } from '../../../lib/api-response';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return jsonOk({ user: null });

  return jsonOk({
    user: {
      id: String(locals.user._id),
      username: locals.user.username,
      name: locals.user.name,
      email: locals.user.email,
      avatarUrl: locals.user.avatarUrl,
      role: locals.user.role,
      bio: locals.user.bio,
    },
  });
};
