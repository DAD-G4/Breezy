"use client";
import { useState } from "react";
import Link from "next/link";
import { toggleLike, updatePost, deletePost } from "../../services/posts";
import { report } from "../../services/moderation";
import { blockUser } from "../../services/users";
import { useLanguage } from "../../context/LanguageContext";
import ImageModal from "../ui/ImageModal";
import Toast from "../ui/Toast";
import ConfirmDialog from "../ui/ConfirmDialog";

export default function PostCard({ post, disableProfileLink = false, currentUserId, onDelete, onUpdate, onBlock }) {
  const { t } = useLanguage();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [reported, setReported] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editSaving, setEditSaving] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [blockedToast, setBlockedToast] = useState(false);

  const isOwner = currentUserId != null && post.userId === currentUserId;

  const handleReport = async () => {
    setIsMenuOpen(false);
    if (reported) return;
    try {
      await report({ targetType: "post", targetId: post.id, reason: "Contenu inapproprié" });
      setReported(true);
      setShowToast(true);
    } catch (err) {
      console.error('[PostCard] Failed to report:', err);
      setReported(false);
    }
  };

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const { liked, likesCount: count } = await toggleLike(post.id);
      setIsLiked(liked);
      setLikesCount(count);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await deletePost(post.id);
      onDelete?.(post.id);
    } catch (err) {
      console.error('[PostCard] Failed to delete:', err);
    }
  };

  const handleBlock = () => {
    setIsMenuOpen(false);
    setConfirmBlockOpen(true);
  };

  const confirmBlock = async () => {
    setConfirmBlockOpen(false);
    try {
      await blockUser(post.userId);
      setBlockedToast(true);
      onBlock?.(post.userId); // retire les posts de cet utilisateur du feed
    } catch (err) {
      console.error('[PostCard] Failed to block user:', err);
    }
  };

  const handleEditStart = () => {
    setIsMenuOpen(false);
    setEditContent(post.content);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  const handleEditSave = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === post.content) {
      setIsEditing(false);
      return;
    }
    setEditSaving(true);
    try {
      await updatePost(post.id, trimmed);
      onUpdate?.(post.id, trimmed);
      setIsEditing(false);
    } catch (err) {
      console.error('[PostCard] Failed to update:', err);
    } finally {
      setEditSaving(false);
    }
  };

  const renderContentWithHashtags = (content) => {
    if (!content) return null;
    // Rend cliquables les #hashtags (→ recherche) ET les @mentions (→ profil).
    const parts = content.split(/([#@]\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <Link
            key={i}
            href={`/search?q=${tag}`}
            className="text-steel-blue hover:underline font-medium"
          >
            {part}
          </Link>
        );
      }
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <Link
            key={i}
            href={`/profile/${username}`}
            className="text-steel-blue hover:underline font-medium"
          >
            {part}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const userInfoContent = (
    <>
      <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold dark:shadow-[0_0_10px_rgba(102,155,188,0.5)] overflow-hidden group-hover/author:opacity-80 transition-opacity shrink-0">
        {post.avatarUrl ? (
          <img
            src={post.avatarUrl}
            alt={post.username}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.textContent = post.username.charAt(0).toUpperCase(); }}
          />
        ) : (
          post.username.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex flex-col">
        <span className={`font-bold text-deep-space-blue dark:text-white text-sm ${disableProfileLink ? '' : 'group-hover/author:underline'}`}>
          {post.username}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {post.time}
        </span>
      </div>
    </>
  );


  return (
    <article className="p-4 border-b border-gray-200 dark:border-steel-blue/40 bg-transparent transition-colors duration-200">      
      <div className="flex justify-between items-start mb-3">
        
        {disableProfileLink || !post.authorHandle ? (
          <div className="flex items-center gap-3">
            {userInfoContent}
          </div>
        ) : (
          <Link href={`/profile/${post.authorHandle}`} className="flex items-center gap-3 group/author cursor-pointer">
            {userInfoContent}
          </Link>
        )}

        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-500 hover:text-deep-space-blue dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              ></div>

              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface border border-gray-200 dark:border-steel-blue/40 rounded-xl shadow-lg dark:shadow-[0_5px_20px_rgba(0,0,0,0.5)] z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                
                {isOwner && (
                  <>
                    <button
                      onClick={handleEditStart}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-deep-space-blue dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('postCard.edit')}
                    </button>

                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brick-red hover:bg-brick-red/10 dark:hover:bg-brick-red/40 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('postCard.delete')}
                    </button>
                  </>
                )}

                {/* Signaler / Bloquer : uniquement sur les posts des AUTRES. */}
                {!isOwner && (
                  <>
                    <button
                      onClick={handleReport}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-deep-space-blue dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      {reported ? t('postCard.reported') : t('postCard.report')}
                    </button>

                    <hr className="border-gray-100 dark:border-white/10" />

                    <button
                      onClick={handleBlock}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brick-red hover:bg-brick-red/10 dark:hover:bg-brick-red/40 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      {t('postCard.block').replace('{{username}}', post.username)}
                    </button>
                  </>
                )}

              </div>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
            maxLength={280}
            className="w-full p-3 text-sm rounded-xl bg-gray-100 dark:bg-black/20 text-deep-space-blue dark:text-white outline-none border border-steel-blue resize-none min-h-[80px] transition-colors"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleEditSave}
              disabled={editSaving || !editContent.trim()}
              className="px-4 py-1.5 text-sm font-semibold bg-steel-blue text-white rounded-full hover:bg-deep-space-blue transition-colors disabled:opacity-50"
            >
              {editSaving ? t('postCard.editing') : t('postCard.save')}
            </button>
            <button
              onClick={handleEditCancel}
              disabled={editSaving}
              className="px-4 py-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-deep-space-blue dark:hover:text-white transition-colors"
            >
              {t('postCard.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-deep-space-blue dark:text-white/90 mb-3 leading-relaxed">
          {renderContentWithHashtags(post.content)}
        </p>
      )}

      {post.imageUrl && (
        <>
          <div
            className="mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          >
            <img src={post.imageUrl} alt={t('postCard.imageAlt')} className="mx-auto max-h-[340px] w-auto max-w-full object-contain" />
          </div>
          {lightboxOpen && (
            <ImageModal
              src={post.imageUrl}
              alt={t('postCard.imageAlt')}
              onClose={() => setLightboxOpen(false)}
            />
          )}
        </>
      )}

      {post.videoUrl && (
        <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <video src={post.videoUrl} controls className="w-full h-auto max-h-[480px] bg-black" />
        </div>
      )}

      <div className="flex gap-6 mt-2 text-gray-500 dark:text-gray-400">
        
        <Link 
          href={`/post/${post.id}`} 
          className="flex items-center gap-1.5 hover:text-steel-blue transition-colors group text-gray-500 dark:text-gray-400"
        >
          <div className="p-1.5 rounded-full group-hover:bg-steel-blue/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xs font-medium">{post.commentsCount || 0}</span>
        </Link>

        <button 
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-brick-red' : 'hover:text-brick-red text-gray-500 dark:text-gray-400'}`}
        >
          <div className="p-1.5 rounded-full group-hover:bg-brick-red/10 transition-colors">
            <svg className="w-5 h-5 transition-all" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium">{likesCount}</span>
        </button>

      </div>

      {showToast && (
        <Toast message={t('toast.postReported')} />
      )}
      {blockedToast && (
        <Toast message={t('postCard.block').replace('{{username}}', post.username)} />
      )}

      {/* Confirmations animées (remplacent window.confirm) */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        variant="danger"
        icon="warning"
        title={t('postCard.deleteConfirmTitle')}
        message={t('postCard.deleteConfirmMessage')}
        confirmLabel={t('postCard.delete')}
        cancelLabel={t('postCard.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
      <ConfirmDialog
        open={confirmBlockOpen}
        variant="danger"
        icon="block"
        title={t('postCard.blockConfirmTitle')}
        message={t('postCard.block').replace('{{username}}', post.username)}
        confirmLabel={t('postCard.blockConfirm')}
        cancelLabel={t('postCard.cancel')}
        onConfirm={confirmBlock}
        onCancel={() => setConfirmBlockOpen(false)}
      />
    </article>
  );
}
