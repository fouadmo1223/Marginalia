import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../../lib/db';
import { User } from '../../../../models/User';
import { exchangeGoogleCode, fetchGoogleUserInfo } from '../../../../lib/google-oauth';
import { createSession } from '../../../../lib/session';
import { getClientIp } from '../../../../lib/rate-limit';
import { nanoid } from 'nanoid';

export const prerender = false;

async function generateUniqueUsername(seed: string): Promise<string> {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24) || 'user';

  let candidate = base;
  let attempt = 0;
  while (await User.exists({ usernameLower: candidate })) {
    attempt += 1;
    candidate = `${base}${nanoid(4).toLowerCase()}`;
    if (attempt > 5) break;
  }
  return candidate;
}

export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('google_oauth_state')?.value;
  cookies.delete('google_oauth_state', { path: '/' });

  if (!code || !state || !storedState || state !== storedState) {
    return redirect('/login?error=oauth_failed');
  }

  try {
    await connectToDatabase();

    const tokens = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    if (!profile.email || !profile.email_verified) {
      return redirect('/login?error=oauth_email_unverified');
    }

    let user = await User.findOne({ googleId: profile.sub });

    if (!user) {
      // Link to an existing email/password account if one matches, otherwise create new.
      user = await User.findOne({ emailLower: profile.email.toLowerCase() });

      if (user) {
        user.googleId = profile.sub;
        if (!user.avatarUrl && profile.picture) user.avatarUrl = profile.picture;
        user.emailVerified = true;
        await user.save();
      } else {
        const username = await generateUniqueUsername(profile.email.split('@')[0] ?? profile.name);
        user = await User.create({
          name: profile.name || username,
          username,
          usernameLower: username.toLowerCase(),
          email: profile.email,
          emailLower: profile.email.toLowerCase(),
          passwordHash: null,
          googleId: profile.sub,
          avatarUrl: profile.picture ?? null,
          emailVerified: true,
        });
      }
    }

    if (user.status === 'disabled') {
      return redirect('/login?error=account_disabled');
    }

    await createSession(cookies, {
      userId: String(user._id),
      userAgent: request.headers.get('user-agent') ?? '',
      ip: getClientIp(request),
    });

    return redirect('/dashboard');
  } catch (err) {
    console.error('Google OAuth callback failed', err);
    return redirect('/login?error=oauth_failed');
  }
};
