"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../components/layout/AppShell";
import PostCard from "../../../components/feed/PostCard";
import { getApiErrorMessage } from "../../../lib/api";
import { mapPost, relativeTime } from "../../../lib/mappers";
import { getPost, addComment, addReply, deleteComment } from "../../../services/posts";
import { resolveUsers } from "../../../services/users";
import { useAuth, useRequireAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";

export default function PostDetailsPage({ params }) {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const resolvedParams = use(params);
  const postId = resolvedParams.id;

  const [mainPost, setMainPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Réponses : on suit le commentaire en cours de réponse + le texte saisi.
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const myName = user?.username || t("common.me");

  // GET /api/posts/:id — post réel + ses commentaires (auteurs résolus).
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const post = await getPost(postId);

        const allUserIds = [post.user_id];
        (post.comments || []).forEach((c) => {
          allUserIds.push(c.user_id);
          (c.replies || []).forEach((r) => allUserIds.push(r.user_id));
        });
        const allAuthors = await resolveUsers(allUserIds);

        const authorMap = {};
        allUserIds.forEach((id, i) => { authorMap[id] = allAuthors[i]; });

        const author = authorMap[post.user_id];
        const mapped = mapPost(post, { authorLabel: author?.displayName, authorHandle: author?.username, avatarUrl: author?.avatarUrl, currentUserId: user?.id, locale: language });

        const mappedComments = (post.comments || []).map((c) => {
          const ca = authorMap[c.user_id];
          const replies = (c.replies || []).map((r) => {
            const ra = authorMap[r.user_id];
            return { id: r.reply_id, username: ra?.displayName, authorHandle: ra?.username, time: relativeTime(r.created_at, language), content: r.content };
          });
          return { id: c.comment_id, userId: c.user_id, username: ca?.displayName, authorHandle: ca?.username, time: relativeTime(c.created_at, language), content: c.content, replies };
        });

        if (active) {
          setMainPost(mapped);
          setComments(mappedComments);
        }
      } catch (err) {
        if (active) setLoadError(getApiErrorMessage(err, t('post.loadError')));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [postId, user]);

  // Fx7 — Commenter : POST /api/posts/:id/comment { content }
  const handleAddComment = async (e) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || submitting) return;

    setError("");
    setSubmitting(true);
    try {
      const created = await addComment(postId, content); // { comment_id, content, ... }
      setComments([
        {
          id: created.comment_id,
          username: myName,
          authorHandle: user?.username,
          time: t('post.justNow'),
          content: created.content,
          replies: [],
        },
        ...comments,
      ]);
      setNewComment("");
    } catch (err) {
      setError(getApiErrorMessage(err, t('post.commentError')));
    } finally {
      setSubmitting(false);
    }
  };

  // Fx8 — Répondre : POST /api/posts/:id/comment/:commentId/reply { content }
  const handleAddReply = async (commentId) => {
    const content = replyText.trim();
    if (!content) return;

    setError("");
    try {
      const created = await addReply(postId, commentId, content); // { reply_id, content, ... }
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: [
                  ...(c.replies || []),
                  { id: created.reply_id, username: myName, authorHandle: user?.username, time: t('post.justNow'), content: created.content },
                ],
              }
            : c
        )
      );
      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      setError(getApiErrorMessage(err, t('post.replyError')));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(postId, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(getApiErrorMessage(err, t('post.deleteCommentError')));
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-4">

        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all w-fit"
            aria-label={t('common.back')}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {loading && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.loading')}</p>
        )}
        {!loading && loadError && (
          <p className="text-center text-brick-red font-semibold py-8">{loadError}</p>
        )}

        {!loading && !loadError && mainPost && (
          <PostCard
            post={mainPost}
            currentUserId={user?.id}
            onDelete={() => router.push('/')}
            onUpdate={(postId, content) => setMainPost((prev) => (prev?.id === postId ? { ...prev, content } : prev))}
          />
        )}

        {!loading && !loadError && mainPost && (
        <>
        <div className="h-px bg-gray-200 dark:bg-steel-blue/30 my-2"></div>

        {/* Composer (style Twitter/X : avatar + zone de texte) */}
        <form onSubmit={handleAddComment} className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-steel-blue shrink-0 flex items-center justify-center text-white font-bold">
            {(myName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('postDetails.addCommentPlaceholder')}
              rows={2}
              className="w-full px-4 py-2.5 text-[15px] rounded-2xl border border-gray-200 dark:border-steel-blue/40 bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-white outline-none focus:border-steel-blue resize-none transition-colors"
            />
            <div className="flex justify-end">
              <button type="submit" disabled={!newComment.trim() || submitting} className="px-5 py-2 bg-steel-blue hover:bg-deep-space-blue text-white rounded-full font-bold text-sm transition-colors disabled:opacity-50">
                {t('commentSection.comment')}
              </button>
            </div>
          </div>
        </form>

        {/* Message d'erreur API */}
        {error && (
          <p className="text-center text-brick-red font-semibold text-sm">{error}</p>
        )}

        {/* Liste des commentaires (fil Twitter/X) */}
        <div className="flex flex-col mt-2">
          <h3 className="font-bold text-lg text-deep-space-blue dark:text-white mb-1 px-1">
            {t('commentSection.comments')} · {comments.length}
          </h3>

          {comments.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10 text-sm">
              {t('commentSection.empty')}
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="border-t border-gray-100 dark:border-steel-blue/20 py-4">
              <div className="flex gap-3">
                {/* Avatar (cliquable) */}
                {comment.authorHandle ? (
                  <Link href={`/profile/${comment.authorHandle}`} className="w-10 h-10 rounded-full bg-steel-blue shrink-0 flex items-center justify-center text-white font-bold hover:opacity-80 transition-opacity">
                    {comment.username.charAt(0).toUpperCase()}
                  </Link>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-steel-blue shrink-0 flex items-center justify-center text-white font-bold">
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col flex-1 min-w-0">
                  {/* En-tête : nom · @handle · temps */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {comment.authorHandle ? (
                      <Link href={`/profile/${comment.authorHandle}`} className="font-bold text-[15px] text-deep-space-blue dark:text-white hover:underline">{comment.username}</Link>
                    ) : (
                      <span className="font-bold text-[15px] text-deep-space-blue dark:text-white">{comment.username}</span>
                    )}
                    {comment.authorHandle && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">@{comment.authorHandle}</span>
                    )}
                    <span className="text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{comment.time}</span>
                  </div>

                  {/* Contenu */}
                  <p className="text-[15px] text-deep-space-blue dark:text-white/90 mt-0.5 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-5 mt-2 text-gray-500 dark:text-gray-400">
                    <button
                      onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(""); }}
                      className="flex items-center gap-1.5 text-xs font-semibold hover:text-steel-blue transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {t('commentSection.reply')}
                    </button>
                    {comment.userId === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold hover:text-brick-red transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {t('commentSection.delete')}
                      </button>
                    )}
                  </div>

                  {/* Formulaire de réponse */}
                  {replyingTo === comment.id && (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleAddReply(comment.id); }}
                      className="flex gap-2 mt-3"
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t('conversation.placeholder')}
                        autoFocus
                        className="flex-1 px-4 py-2 text-sm rounded-full border border-gray-300 dark:border-steel-blue/40 bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-white outline-none focus:border-steel-blue transition-colors"
                      />
                      <button type="submit" disabled={!replyText.trim()} className="px-4 py-2 text-sm bg-steel-blue hover:bg-deep-space-blue text-white rounded-full font-semibold transition-colors disabled:opacity-50">
                        {t('post.send')}
                      </button>
                    </form>
                  )}

                  {/* Réponses existantes (fil avec barre latérale) */}
                  {comment.replies?.length > 0 && (
                    <div className="mt-3 flex flex-col gap-3 border-l-2 border-gray-100 dark:border-steel-blue/20 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2.5">
                          {reply.authorHandle ? (
                            <Link href={`/profile/${reply.authorHandle}`} className="w-8 h-8 rounded-full bg-steel-blue/80 shrink-0 flex items-center justify-center text-white font-bold text-xs hover:opacity-80 transition-opacity">
                              {reply.username.charAt(0).toUpperCase()}
                            </Link>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-steel-blue/80 shrink-0 flex items-center justify-center text-white font-bold text-xs">
                              {reply.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {reply.authorHandle ? (
                                <Link href={`/profile/${reply.authorHandle}`} className="font-bold text-sm text-deep-space-blue dark:text-white hover:underline">{reply.username}</Link>
                              ) : (
                                <span className="font-bold text-sm text-deep-space-blue dark:text-white">{reply.username}</span>
                              )}
                              {reply.authorHandle && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">@{reply.authorHandle}</span>
                              )}
                              <span className="text-gray-400 dark:text-gray-500">·</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{reply.time}</span>
                            </div>
                            <p className="text-sm text-deep-space-blue dark:text-white/90 leading-relaxed whitespace-pre-wrap break-words">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
        )}

      </div>
    </AppShell>
  );
}
