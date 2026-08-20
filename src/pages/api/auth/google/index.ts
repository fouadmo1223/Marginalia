import type { APIRoute } from 'astro';
import { buildGoogleAuthUrl } from '../../../../lib/google-oauth';
import { generateOpaqueToken } from '../../../../lib/crypto';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const { token: state } = generateOpaqueToken();

  cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });

  return redirect(buildGoogleAuthUrl(state));
};
