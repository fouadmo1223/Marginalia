import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';

export interface IUser {
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  passwordHash: string | null;
  googleId: string | null;
  name: string;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  bio: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerificationTokenHash: string | null;
  emailVerificationExpires: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetExpires: Date | null;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, maxlength: 32 },
    usernameLower: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true },
    emailLower: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, default: null, select: false },
    // No `default` here: sparse+unique only excludes documents where the field is
    // absent. Explicitly setting it to `null` would make every password-only account
    // collide on the same indexed null value.
    googleId: { type: String, index: true, sparse: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    avatarUrl: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    bio: { type: String, default: '', maxlength: 280 },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    followersCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

userSchema.index({ name: 'text', username: 'text', bio: 'text' });

export type UserDocument = HydratedDocument<IUser>;

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);
