"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/layout/Header";
import BottomNav from "../../../components/layout/BottomNav";
import PostCard from "../../../components/feed/PostCard";

export default function PostDetailsPage({ params }) {
  const router = useRouter();
  
  // etats pour gérer les likes et les commentaires
  const resolvedParams = use(params);
  const postId = resolvedParams.id;

  // Mock datas A REMPLACER PAR UN APPEL API VERS LE BACK-END POUR RÉCUPÉRER LES DONNÉES DU POST
  const mainPost = {
    id: postId,
    username: "Jane Doe",
    time: "1h",
    content: "Voici le détail de ce post ! On peut maintenant lire les commentaires en dessous.",
    likesCount: 12,
    commentsCount: 2,
  };

  const [comments, setComments] = useState([
    { id: 1, username: "Alice", time: "45min", content: "Super post, totalement d'accord ! 🔥" },
    { id: 2, username: "Bob", time: "30min", content: "Intéressant, merci du partage." },
  ]);
  const [newComment, setNewComment] = useState("");

  // AJOUTER COMMENTAIRE 
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      username: "Moi", 
      time: "À l'instant",
      content: newComment,
    };

    setComments([comment, ...comments]); 
    setNewComment(""); 
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header />
      
      <main className="flex-1 flex flex-col p-4 gap-4">
        
        <button 
          onClick={() => router.back()} 
          className="p-2 -ml-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all w-fit"
          aria-label="Retour"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <PostCard post={mainPost} />

        <div className="h-px bg-gray-200 dark:bg-steel-blue/30 my-2"></div>

        {/* Formulaire Commentaire */}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ajouter un commentaire..." className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-steel-blue/40 bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue transition-colors" />
          <button type="submit" disabled={!newComment.trim()} className="p-2 bg-steel-blue hover:bg-deep-space-blue text-white rounded-full transition-colors disabled:opacity-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>

        {/* Liste des commentaires */}
        <div className="flex flex-col gap-4 mt-4">
          <h3 className="font-bold text-deep-space-blue dark:text-papaya-whip">Commentaires ({comments.length})</h3>
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-white dark:bg-deep-space-blue border border-gray-100 dark:border-steel-blue/20 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-steel-blue flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                {comment.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip">{comment.username}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{comment.time}</span>
                </div>
                <p className="text-sm text-deep-space-blue/90 dark:text-papaya-whip/90 mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

      </main>
      <BottomNav />
    </div>
  );
}