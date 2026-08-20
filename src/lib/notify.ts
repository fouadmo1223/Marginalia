import { Notification, type NotificationType } from '../models/Notification';
import type { Types } from 'mongoose';

interface CreateNotificationInput {
  recipient: string | Types.ObjectId;
  actor: string | Types.ObjectId;
  type: NotificationType;
  blog?: string | Types.ObjectId | null;
  comment?: string | Types.ObjectId | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  // Never notify yourself about your own action.
  if (String(input.recipient) === String(input.actor)) return;

  await Notification.create({
    recipient: input.recipient,
    actor: input.actor,
    type: input.type,
    blog: input.blog ?? null,
    comment: input.comment ?? null,
  });
}
