import type { APIRoute } from 'astro';
import { destroySession } from '../../../lib/session';
import { jsonOk, handleApiError } from '../../../lib/api-response';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    await destroySession(cookies);
    return jsonOk({ loggedOut: true });
  } catch (err) {
    return handleApiError(err);
  }
};
