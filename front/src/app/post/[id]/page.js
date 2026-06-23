"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import PostCard from "../../../components/feed/PostCard";
import { getApiErrorMessage } from "../../../lib/api";
import { mapPost, relativeTime } from "../../../lib/mappers";
import { getPost, addComment, addReply } from "../../../services/posts";
import { resolveUser } from "../../../services/users";
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

  const myName = user?.username || "Moi";

  // GET /api/posts/:id — post réel + ses commentaires (auteurs résolus).
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const post = await getPost(postId);
        const author = await resolveUser(post.user_id);
        const mapped = mapPost(post, { authorLabel: author.displayName, currentUserId: user?.id, locale: language });

        const mappedComments = await Promise.all(
          (post.comments || []).map(async (c) => {
            const ca = await resolveUser(c.user_id);
            const replies = await Promise.all(
              (c.replies || []).map(async (r) => {
                const ra = await resolveUser(r.user_id);
                return { id: r.reply_id, username: ra.displayName, time: relativeTime(r.created_at, language), content: r.content };
              })
            );
            return { id: c.comment_id, username: ca.displayName, time: relativeTime(c.created_at, language), content: c.content, replies };
          })
        );

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
                  { id: created.reply_id, username: myName, time: t('post.justNow'), content: created.content },
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
          <PostCard post={mainPost} />
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
                <div className="w-8 h-8 rounded-full bg-steel-blue flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                  {comment.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip">{comment.username}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{comment.time}</span>
                  </div>
                  <p className="text-sm text-deep-space-blue/90 dark:text-papaya-whip/90 mt-1">{comment.content}</p>

                  {/* Bouton Répondre (Fx8) */}
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      setReplyText("");
                    }}
                    className="text-xs font-semibold text-steel-blue hover:underline w-fit mt-1.5"
                  >
                    {t('commentSection.reply')}
                  </button>
                </div>
              </div>

              {/* Réponses existantes */}
              {comment.replies?.length > 0 && (
                <div className="flex flex-col gap-2 pl-11">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-steel-blue/70 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px]">
                        {reply.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-xs text-deep-space-blue dark:text-papaya-whip">{reply.username}</span>
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
