import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';
import { loginSchema } from '../../../lib/validation/auth';
import { verifyPassword } from '../../../lib/crypto';
import { createSession } from '../../../lib/session';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { rateLimit, getClientIp } from '../../../lib/rate-limit';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!limited.allowed) {
      return jsonError('Too many login attempts. Please try again later.', 429);
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);
    }

    const { email, password } = parsed.data;
    await connectToDatabase();

    const user = await User.findOne({ emailLower: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return jsonError('Invalid email or password', 401);
    }

    if (user.status === 'disabled') {
      return jsonError('This account has been disabled.', 403);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      // Also rate-limit per-account to slow credential stuffing against one target.
      rateLimit(`login-account:${String(user._id)}`, 10, 15 * 60 * 1000);
      return jsonError('Invalid email or password', 401);
    }

    await createSession(cookies, {
      userId: String(user._id),
      userAgent: request.headers.get('user-agent') ?? '',
      ip,
    });

    return jsonOk({ id: String(user._id), username: user.username, name: user.name, role: user.role });
  } catch (err) {
    return handleApiError(err);
  }
};
