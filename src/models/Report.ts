import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export type ReportTargetType = 'user' | 'blog' | 'comment';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';

export interface IReport {
  reporter: Types.ObjectId;
  targetType: ReportTargetType;
  targetId: Types.ObjectId;
  reason: string;
  details: string;
  status: ReportStatus;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['user', 'blog', 'comment'], required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true, maxlength: 100 },
    details: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

export type ReportDocument = HydratedDocument<IReport>;

export const Report: Model<IReport> =
  (mongoose.models.Report as Model<IReport>) || mongoose.model<IReport>('Report', reportSchema);
