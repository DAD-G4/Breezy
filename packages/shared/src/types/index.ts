import { Request } from 'express';

// ── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

// ── PostgreSQL Models ────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_validated: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: number;
  user_id: number;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  language_preference: string;
  theme_preference: string;
}

export interface Follow {
  id: number;
  follower_id: number;
  following_id: number;
  created_at: Date;
}

export interface Ban {
  id: number;
  user_id: number;
  reason: string;
  banned_by: number;
  expires_at: Date | null;
  created_at: Date;
}

// ── MongoDB Documents ────────────────────────────────────────────────────────

export interface Comment {
  comment_id: string;
  user_id: number;
  content: string;
  created_at: Date;
  replies: Reply[];
}

export interface Reply {
  reply_id: string;
  user_id: number;
  content: string;
  created_at: Date;
}

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
}

export interface Post {
  _id: string;
  user_id: number;
  content: string;
  likes: number[];
  comments: Comment[];
  tags: string[];
  media: PostMedia | null;
  created_at: Date;
}

// ── Request Extensions ───────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
  };
}
