/**
 * Creates (or promotes) the admin account defined by ADMIN_* env vars.
 * Safe to re-run: if the account already exists, it's promoted to role=admin
 * and its password is reset to ADMIN_PASSWORD; nothing else is touched.
 *
 * Usage: npm run bootstrap-admin
 */
import 'dotenv/config';
import { connectToDatabase } from '../src/lib/db';
import { User } from '../src/models/User';
import { hashPassword } from '../src/lib/crypto';
import { registerSchema } from '../src/lib/validation/auth';

async function main() {
  const name = process.env.ADMIN_NAME;
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !username || !email || !password) {
    console.error(
      'Missing ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD in .env — set all four and re-run.',
    );
    process.exit(1);
  }

  const parsed = registerSchema.safeParse({ name, username, email, password });
  if (!parsed.success) {
    console.error('Admin credentials in .env are invalid:', parsed.error.issues[0]?.message);
    process.exit(1);
  }

  await connectToDatabase();

  const emailLower = email.toLowerCase();
  const usernameLower = username.toLowerCase();
  const passwordHash = await hashPassword(password);

  const existing = await User.findOne({ $or: [{ emailLower }, { usernameLower }] });

  if (existing) {
    existing.role = 'admin';
    existing.status = 'active';
    existing.emailVerified = true;
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Promoted existing account @${existing.username} to admin and reset its password.`);
  } else {
    const admin = await User.create({
      name,
      username,
      usernameLower,
      email,
      emailLower,
      passwordHash,
      role: 'admin',
      emailVerified: true,
    });
    console.log(`Created admin account @${admin.username} <${admin.email}>.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
