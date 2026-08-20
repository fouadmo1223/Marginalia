import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'mention';

export interface INotification {
  recipient: Types.ObjectId;
  actor: Types.ObjectId;
  type: NotificationType;
  blog: Types.ObjectId | null;
  comment: Types.ObjectId | null;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'comment', 'reply', 'follow', 'mention'], required: true },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', default: null },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

export type NotificationDocument = HydratedDocument<INotification>;

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>('Notification', notificationSchema);
