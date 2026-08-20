import type { AstroCookies } from 'astro';
import { connectToDatabase } from './db';
import { Session } from '../models/Session';
import { User, type UserDocument } from '../models/User';
import { generateOpaqueToken, sha256 } from './crypto';

export const SESSION_COOKIE = 'session_token';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CreateSessionOptions {
  userId: string;
  userAgent?: string;
  ip?: string;
}

export async function createSession(cookies: AstroCookies, opts: CreateSessionOptions): Promise<void> {
  await connectToDatabase();
  const { token, hash } = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await Session.create({
    userId: opts.userId,
    tokenHash: hash,
    userAgent: opts.userAgent ?? '',
    ip: opts.ip ?? '',
    expiresAt,
  });

  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await connectToDatabase();
    await Session.updateOne({ tokenHash: sha256(token) }, { revokedAt: new Date() });
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await connectToDatabase();
  await Session.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
}

/** Resolves the current authenticated user from the session cookie, server-side only. */
export async function getCurrentUser(cookies: AstroCookies): Promise<UserDocument | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await connectToDatabase();
  const session = await Session.findOne({
    tokenHash: sha256(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session) return null;

  const user = await User.findById(session.userId);
  if (!user || user.status === 'disabled') return null;

  return user;
}
