import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface ISession {
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent: string;
  ip: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type SessionDocument = HydratedDocument<ISession>;

export const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession>) || mongoose.model<ISession>('Session', sessionSchema);
