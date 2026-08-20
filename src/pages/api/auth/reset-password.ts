import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';
import { resetPasswordSchema } from '../../../lib/validation/auth';
import { hashPassword, sha256 } from '../../../lib/crypto';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { destroyAllSessions } from '../../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 422);
    }

    await connectToDatabase();
    const tokenHash = sha256(parsed.data.token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires');

    if (!user) {
      return jsonError('This reset link is invalid or has expired.', 400);
    }

    user.passwordHash = await hashPassword(parsed.data.password);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    // Invalidate all existing sessions since the credential changed.
    await destroyAllSessions(String(user._id));

    return jsonOk({ reset: true });
  } catch (err) {
    return handleApiError(err);
  }
};
