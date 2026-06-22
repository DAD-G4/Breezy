"use client";

import { useState } from "react";
import Link from "next/link";

// COMPOSANT INDIVIDUEL
function CommentItem({ comment, isReply = false }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Soumission d'une réponse
  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    // A REMPLACER PAR L'APPEL BACKEND (POST /api/comments)
    alert(`Votre réponse : "${replyText}" a été envoyée !`);
    
    setIsReplying(false);
    setReplyText("");
  };

  return (
    <div className={`flex flex-col ${isReply ? "mt-4" : "mt-6"}`}>
      <div className="flex gap-3">
        
        {/* Avatar */}
        <Link href={`/profile/${comment.username}`} className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold shrink-0 hover:opacity-90 transition-opacity z-10">
          {comment.avatar}
        </Link>

        {/* commentaire */}
        <div className="flex flex-col flex-1 min-w-0">
          
          <div className="flex items-baseline gap-2">
            <Link href={`/profile/${comment.username}`} className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip hover:underline">
              {comment.user}
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">{comment.time}</span>
          </div>

          <p className="text-sm text-deep-space-blue/90 dark:text-papaya-whip/90 mt-0.5 leading-relaxed">
            {comment.text}
          </p>

          {/* Boutons Like & Répondre */}
          <div className="flex items-center gap-4 mt-2">
            <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brick-red transition-colors group">
              <svg className="w-4 h-4 group-hover:fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {comment.likes > 0 && comment.likes}
            </button>
            
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-steel-blue transition-colors"
            >
              {/* Icône flèche de réponse */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Répondre
            </button>
          </div>

          {/* Champ de saisie */}
          {isReplying && (
            <form onSubmit={handleSubmitReply} className="mt-3 flex gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                autoFocus
                placeholder={`Répondre à ${comment.user}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-4 py-2 text-sm rounded-full border border-gray-200 dark:border-steel-blue/40 bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue transition-all"
              />
              <button 
                type="submit" 
                disabled={!replyText.trim()} 
                className="p-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip disabled:opacity-50 transition-colors bg-slate-100 dark:bg-white/5 rounded-full"
              >
                <svg className="w-4 h-4 transform rotate-45 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-5 pl-4 border-l-2 border-gray-100 dark:border-steel-blue/20 flex flex-col">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );
}

// 2. LE COMPOSANT PRINCIPAL (La section entière à importer dans ta page Post)
export default function CommentSection() {
  // MOCK DATA (Simule la réponse d'une API avec des commentaires imbriqués)
  const mockComments = [
    {
      id: 1,
      user: "Alice",
      username: "alice",
      avatar: "A",
      text: "C'est vraiment une super idée d'ajouter ça à l'application !",
      time: "2h",
      likes: 12,
      replies: [
        {
          id: 101,
          user: "Moi",
          username: "moi",
          avatar: "M",
          text: "Merci Alice ! On essaie de faire au mieux.",
          time: "1h",
          likes: 2,
          replies: [
            {
              id: 1001,
              user: "Bob",
              username: "bob",
              avatar: "B",
              text: "Je confirme, la ligne visuelle sur le côté est top.",
              time: "45min",
              likes: 1,
              replies: []
            }
          ]
        }
      ]
    },
    {
      id: 2,
      user: "Charlie",
      username: "charlie",
      avatar: "C",
      text: "Hâte de voir la suite du projet 🚀",
      time: "4h",
      likes: 5,
      replies: []
    }
  ];

  return (
    <section className="mt-4 pt-4 border-t border-gray-200 dark:border-steel-blue/30">
      <h3 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip mb-2">
        Commentaires ({mockComments.length})
      </h3>
      
      <div className="flex flex-col">
        {mockComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </section>
  );
}