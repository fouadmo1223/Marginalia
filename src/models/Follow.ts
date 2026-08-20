import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface IFollow {
  follower: Types.ObjectId;
  following: Types.ObjectId;
  createdAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

export type FollowDocument = HydratedDocument<IFollow>;

export const Follow: Model<IFollow> =
  (mongoose.models.Follow as Model<IFollow>) || mongoose.model<IFollow>('Follow', followSchema);
