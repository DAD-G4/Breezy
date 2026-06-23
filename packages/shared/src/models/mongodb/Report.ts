import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportDocument extends Document {
  reported_by: number;
  target_type: 'post' | 'comment';
  target_id: string;
  reason: string;
  status: 'pending' | 'resolved';
  created_at: Date;
}

const ReportSchema = new Schema({
  reported_by: {
    type: Number,
    required: true,
  },
  target_type: {
    type: String,
    enum: ['post', 'comment'],
    required: true,
  },
  target_id: {
    type: String,
    required: true,
    index: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index: pending reports for moderation queue
ReportSchema.index({ status: 1, created_at: -1 });

const Report: Model<IReportDocument> =
  (mongoose.models['Report'] as Model<IReportDocument>) ||
  mongoose.model<IReportDocument>('Report', ReportSchema);

export default Report;
