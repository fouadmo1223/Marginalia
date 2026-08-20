import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface ILike {
  blog: Types.ObjectId;
  user: Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A user can only like a blog once — enforced at the database level.
likeSchema.index({ blog: 1, user: 1 }, { unique: true });

export type LikeDocument = HydratedDocument<ILike>;

export const Like: Model<ILike> =
  (mongoose.models.Like as Model<ILike>) || mongoose.model<ILike>('Like', likeSchema);
