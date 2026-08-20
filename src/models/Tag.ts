import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export interface ITag {
  name: string;
  slug: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, unique: true, index: true },
    usageCount: { type: Number, default: 0, min: 0, index: true },
  },
  { timestamps: true },
);

export type TagDocument = HydratedDocument<ITag>;

export const Tag: Model<ITag> =
  (mongoose.models.Tag as Model<ITag>) || mongoose.model<ITag>('Tag', tagSchema);
