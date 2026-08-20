import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface IBlock {
  blocker: Types.ObjectId;
  blocked: Types.ObjectId;
  createdAt: Date;
}

const blockSchema = new Schema<IBlock>(
  {
    blocker: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blocked: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export type BlockDocument = HydratedDocument<IBlock>;

export const Block: Model<IBlock> =
  (mongoose.models.Block as Model<IBlock>) || mongoose.model<IBlock>('Block', blockSchema);
