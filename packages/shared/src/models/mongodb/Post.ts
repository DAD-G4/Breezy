import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Sub-document Interfaces ──────────────────────────────────────────────────

export interface IReply {
  reply_id: mongoose.Types.ObjectId;
  user_id: number;
  content: string;
  created_at: Date;
}

export interface IComment {
  comment_id: mongoose.Types.ObjectId;
  user_id: number;
  content: string;
  created_at: Date;
  replies: IReply[];
}

export interface IPostMedia {
  type: 'image' | 'video';
  url: string;
}

// ── Main Document Interface ──────────────────────────────────────────────────

export interface IPostDocument extends Document {
  user_id: number;
  content: string;
  likes: number[];
  comments: IComment[];
  tags: string[];
  media: IPostMedia | null;
  created_at: Date;
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const ReplySchema = new Schema(
  {
    reply_id: { type: Schema.Types.ObjectId, auto: true },
    user_id: { type: Number, required: true },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CommentSchema = new Schema(
  {
    comment_id: { type: Schema.Types.ObjectId, auto: true },
    user_id: { type: Number, required: true },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    replies: { type: [ReplySchema], default: [] },
  },
  { _id: false }
);

const PostMediaSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

// ── Post Schema ──────────────────────────────────────────────────────────────

const PostSchema = new Schema({
  user_id: {
    type: Number,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: [280, 'Content cannot exceed 280 characters'],
  },
  likes: {
    type: [Number],
    default: [],
  },
  comments: {
    type: [CommentSchema],
    default: [],
  },
  tags: {
    type: [String],
    default: [],
    index: true,
  },
  media: {
    type: PostMediaSchema,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for feed queries (user posts sorted by date)
PostSchema.index({ user_id: 1, created_at: -1 });

// ── Model Export ─────────────────────────────────────────────────────────────

const Post: Model<IPostDocument> =
  (mongoose.models as any).Post ||
  mongoose.model<IPostDocument>('Post', PostSchema);

export default Post;
