"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PostCard from "@/components/feed/PostCard";
import CommentSection from "@/components/feed/CommentSection";  
import { useLanguage } from "@/context/LanguageContext";

export default function PostDetailsPage({ params }) {
  const router = useRouter();
  const { t } = useLanguage();
  
  const resolvedParams = use(params);
  const postId = resolvedParams.id;

  // MOCK DATA
  const mainPost = {
    id: postId,
    username: "Jane Doe",
    time: "1h",
    content: "Voici le détail de ce post ! On peut maintenant lire les commentaires en dessous.",
    likesCount: 12,
    commentsCount: 2,
  };

  const [newComment, setNewComment] = useState("");

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // ALERT
    alert(`${t('postDetails.commentPosted')} "${newComment}"`);
    setNewComment(""); 
  };

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-4">

        {/* RETOUR */}
        <button
          onClick={() => router.back()} 
          className="p-2 -ml-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all w-fit"
          aria-label={t('common.back')}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* POST */}
        <PostCard post={mainPost} />

        <div className="h-px bg-gray-200 dark:bg-steel-blue/30 my-2"></div>

        {/* FORMULAIRE COMMENTAIRE */}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input 
            type="text" 
            value={newComment} 
            onChange={(e) => setNewComment(e.target.value)} 
            placeholder={t('postDetails.addCommentPlaceholder')} 
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-steel-blue/40 bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue transition-colors" 
          />
          <button 
            type="submit" 
            disabled={!newComment.trim()} 
            className="p-2 bg-steel-blue hover:bg-deep-space-blue text-white rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <CommentSection />

      </div>
    </AppShell>
  );
}