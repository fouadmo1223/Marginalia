import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';
import { registerSchema } from '../../../lib/validation/auth';
import { hashPassword, generateOpaqueToken } from '../../../lib/crypto';
import { createSession } from '../../../lib/session';
import { jsonError, handleApiError } from '../../../lib/api-response';
import { rateLimit, getClientIp } from '../../../lib/rate-limit';
import { sendEmail, verificationEmailHtml } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!limited.allowed) {
      return jsonError('Too many attempts. Please try again later.', 429);
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);
    }

    const { name, username, email, password } = parsed.data;
    await connectToDatabase();

    const usernameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();

    const existing = await User.findOne({ $or: [{ usernameLower }, { emailLower }] }).lean();
    if (existing) {
      return jsonError(
        existing.emailLower === emailLower ? 'Email is already registered' : 'Username is already taken',
        409,
      );
    }

    const passwordHash = await hashPassword(password);
    const { token: verifyToken, hash: verifyHash } = generateOpaqueToken();

    const user = await User.create({
      name,
      username,
      usernameLower,
      email,
      emailLower,
      passwordHash,
      emailVerificationTokenHash: verifyHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyUrl = `${process.env.PUBLIC_SITE_URL}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: verificationEmailHtml(name, verifyUrl),
    }).catch((err) => console.error('Failed to send verification email', err));

    await createSession(cookies, {
      userId: String(user._id),
      userAgent: request.headers.get('user-agent') ?? '',
      ip,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        data: { id: String(user._id), username: user.username, name: user.name },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return handleApiError(err);
  }
};
