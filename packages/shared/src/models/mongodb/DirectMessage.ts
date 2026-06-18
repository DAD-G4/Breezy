import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDirectMessageDocument extends Document {
  conversation_id: string;
  sender_id: number;
  recipient_id: number;
  message_text: string;
  created_at: Date;
}

const DirectMessageSchema = new Schema({
  conversation_id: {
    type: String,
    required: true,
    index: true,
  },
  sender_id: {
    type: Number,
    required: true,
  },
  recipient_id: {
    type: Number,
    required: true,
  },
  message_text: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index: conversation messages sorted by date
DirectMessageSchema.index({ conversation_id: 1, created_at: -1 });

const DirectMessage: Model<IDirectMessageDocument> =
  (mongoose.models as any).DirectMessage ||
  mongoose.model<IDirectMessageDocument>('DirectMessage', DirectMessageSchema);

export default DirectMessage;
