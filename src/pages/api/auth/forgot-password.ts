import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';
import { forgotPasswordSchema } from '../../../lib/validation/auth';
import { generateOpaqueToken } from '../../../lib/crypto';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { rateLimit, getClientIp } from '../../../lib/rate-limit';
import { sendEmail, passwordResetEmailHtml } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const limited = rateLimit(`forgot-password:${getClientIp(request)}`, 5, 60 * 60 * 1000);
    if (!limited.allowed) return jsonError('Too many attempts. Please try again later.', 429);

    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return jsonError('Invalid input', 422);

    await connectToDatabase();
    const user = await User.findOne({ emailLower: parsed.data.email.toLowerCase() });

    // Always respond success to avoid leaking which emails are registered.
    if (user) {
      const { token, hash } = generateOpaqueToken();
      user.passwordResetTokenHash = hash;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = `${process.env.PUBLIC_SITE_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html: passwordResetEmailHtml(user.name, resetUrl),
      }).catch((err) => console.error('Failed to send reset email', err));
    }

    return jsonOk({ sent: true });
  } catch (err) {
    return handleApiError(err);
  }
};
