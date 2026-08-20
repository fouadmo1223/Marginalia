import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export type HomeSection = 'featured' | 'trending' | 'gallery';

export interface IHomeFeature {
  section: HomeSection;
  blog: Types.ObjectId;
  order: number;
  createdAt: Date;
}

const homeFeatureSchema = new Schema<IHomeFeature>(
  {
    section: { type: String, enum: ['featured', 'trending', 'gallery'], required: true, index: true },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A blog can only be curated once per section.
homeFeatureSchema.index({ section: 1, blog: 1 }, { unique: true });
homeFeatureSchema.index({ section: 1, order: 1 });

export type HomeFeatureDocument = HydratedDocument<IHomeFeature>;

export const HomeFeature: Model<IHomeFeature> =
  (mongoose.models.HomeFeature as Model<IHomeFeature>) ||
  mongoose.model<IHomeFeature>('HomeFeature', homeFeatureSchema);
