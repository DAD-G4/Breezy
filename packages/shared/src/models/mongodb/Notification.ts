import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationDocument extends Document {
  recipient_id: number;
  sender_id: number;
  type: 'mention' | 'like' | 'follow';
  post_id: mongoose.Types.ObjectId | null;
  is_read: boolean;
  created_at: Date;
}

const NotificationSchema = new Schema({
  recipient_id: {
    type: Number,
    required: true,
    index: true,
  },
  sender_id: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['mention', 'like', 'follow'],
    required: true,
  },
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
  },
  is_read: {
    type: Boolean,
    default: false,
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index: user's unread notifications
NotificationSchema.index({ recipient_id: 1, is_read: 1 });

// Compound index: user's notifications sorted by date
NotificationSchema.index({ recipient_id: 1, created_at: -1 });

const Notification: Model<INotificationDocument> =
  (mongoose.models['Notification'] as Model<INotificationDocument>) ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default Notification;
