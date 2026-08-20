import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '', maxlength: 300 },
    icon: { type: String, default: '' },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);

export type CategoryDocument = HydratedDocument<ICategory>;

export const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) || mongoose.model<ICategory>('Category', categorySchema);
