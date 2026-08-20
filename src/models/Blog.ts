import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export type BlogStatus = 'draft' | 'published';

export interface IBlogImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export interface IBlog {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: IBlogImage | null;
  images: IBlogImage[];
  author: Types.ObjectId;
  categories: Types.ObjectId[];
  tags: Types.ObjectId[];
  status: BlogStatus;
  publishedAt: Date | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogImageSchema = new Schema<IBlogImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  { _id: false },
);

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: '', maxlength: 400 },
    content: { type: String, required: true },
    coverImage: { type: blogImageSchema, default: null },
    images: { type: [blogImageSchema], default: [] },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag', index: true }],
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date, default: null, index: true },
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    viewsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

blogSchema.index({ author: 1, status: 1, createdAt: -1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export type BlogDocument = HydratedDocument<IBlog>;

export const Blog: Model<IBlog> =
  (mongoose.models.Blog as Model<IBlog>) || mongoose.model<IBlog>('Blog', blogSchema);
