import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface IComment {
  blog: Types.ObjectId;
  author: Types.ObjectId;
  parent: Types.ObjectId | null;
  content: string;
  editedAt: Date | null;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    editedAt: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

commentSchema.index({ blog: 1, createdAt: -1 });

export type CommentDocument = HydratedDocument<IComment>;

export const Comment: Model<IComment> =
  (mongoose.models.Comment as Model<IComment>) || mongoose.model<IComment>('Comment', commentSchema);
