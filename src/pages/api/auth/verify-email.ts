import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';
import { sha256 } from '../../../lib/crypto';
import { jsonError, jsonOk, handleApiError } from '../../../lib/api-response';
import { z } from 'zod';

export const prerender = false;

const schema = z.object({ token: z.string().min(1) });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError('Invalid input', 422);

    await connectToDatabase();
    const tokenHash = sha256(parsed.data.token);

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationTokenHash +emailVerificationExpires');

    if (!user) {
      return jsonError('This verification link is invalid or has expired.', 400);
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    return jsonOk({ verified: true });
  } catch (err) {
    return handleApiError(err);
  }
};
