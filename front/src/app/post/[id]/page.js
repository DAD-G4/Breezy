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
        const mapped = mapPost(post, { authorLabel: author?.displayName, avatarUrl: author?.avatarUrl, currentUserId: user?.id, locale: language });

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

        {/* Formulaire Commentaire */}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t('postDetails.addCommentPlaceholder')} className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-steel-blue/40 bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue transition-colors" />
          <button type="submit" disabled={!newComment.trim() || submitting} className="p-2 bg-steel-blue hover:bg-deep-space-blue text-white rounded-full transition-colors disabled:opacity-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>

        {/* Message d'erreur API */}
        {error && (
          <p className="text-center text-brick-red font-semibold text-sm">{error}</p>
        )}

        {/* Liste des commentaires */}
        <div className="flex flex-col gap-4 mt-4">
          <h3 className="font-bold text-deep-space-blue dark:text-papaya-whip">{t('commentSection.comments')} ({comments.length})</h3>
          {comments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-3 p-3 bg-white dark:bg-deep-space-blue border border-gray-100 dark:border-steel-blue/20 rounded-xl shadow-sm">
              <div className="flex gap-3">
                {comment.authorHandle ? (
                  <Link href={`/profile/${comment.authorHandle}`} className="w-8 h-8 rounded-full bg-steel-blue flex-shrink-0 flex items-center justify-center text-white font-bold text-xs hover:opacity-80 transition-opacity">
                    {comment.username.charAt(0).toUpperCase()}
                  </Link>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-steel-blue flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col flex-1">
                  <div className="flex items-baseline gap-2">
                    {comment.authorHandle ? (
                      <Link href={`/profile/${comment.authorHandle}`} className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip hover:underline">{comment.username}</Link>
                    ) : (
                      <span className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip">{comment.username}</span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{comment.time}</span>
                  </div>
                  <p className="text-sm text-deep-space-blue/90 dark:text-papaya-whip/90 mt-1">{comment.content}</p>

                  {/* Bouton Répondre (Fx8) */}
                  <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      setReplyText("");
                    }}
                    className="text-xs font-semibold text-steel-blue hover:underline w-fit"
                  >
                    {t('commentSection.reply')}
                  </button>
                  {comment.userId === user?.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs font-semibold text-brick-red hover:underline w-fit"
                    >
                      {t('commentSection.delete')}
                    </button>
                  )}
                  </div>
                </div>
              </div>

              {/* Réponses existantes */}
              {comment.replies?.length > 0 && (
                <div className="flex flex-col gap-2 pl-11">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2 items-start">
                      {reply.authorHandle ? (
                        <Link href={`/profile/${reply.authorHandle}`} className="w-6 h-6 rounded-full bg-steel-blue/70 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] hover:opacity-80 transition-opacity">
                          {reply.username.charAt(0).toUpperCase()}
                        </Link>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-steel-blue/70 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px]">
                          {reply.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          {reply.authorHandle ? (
                            <Link href={`/profile/${reply.authorHandle}`} className="font-bold text-xs text-deep-space-blue dark:text-papaya-whip hover:underline">{reply.username}</Link>
                          ) : (
                            <span className="font-bold text-xs text-deep-space-blue dark:text-papaya-whip">{reply.username}</span>
                          )}
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{reply.time}</span>
                        </div>
                        <p className="text-xs text-deep-space-blue/90 dark:text-papaya-whip/90">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire de réponse (affiché au clic sur Répondre) */}
              {replyingTo === comment.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddReply(comment.id);
                  }}
                  className="flex gap-2 pl-11"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t('conversation.placeholder')}
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-steel-blue/40 bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue transition-colors"
                  />
                  <button type="submit" disabled={!replyText.trim()}                     className="px-3 py-1.5 text-sm bg-steel-blue hover:bg-deep-space-blue text-white rounded-full font-semibold transition-colors disabled:opacity-50">
                    {t('post.send')}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
        </>
        )}

      </div>
    </AppShell>
  );
}
