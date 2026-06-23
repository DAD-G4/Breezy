"use client";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function PostCard({ post, disableProfileLink = false }) {
  const { t } = useLanguage();

  // Etats pour gérer le like
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);

  const handleLike = () => {
    if (isLiked) {
      setLikesCount(likesCount - 1);
      setIsLiked(false);
    } else {
      setLikesCount(likesCount + 1);
      setIsLiked(true);
    }
  };

  // Etat pour gérer le menu déroulant 3 points
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // on stock l'avatar nom dans une variable
  const userInfoContent = (
    <>
      <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold dark:shadow-[0_0_10px_rgba(102,155,188,0.5)] overflow-hidden group-hover/author:opacity-80 transition-opacity">
        {post.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col">
        <span className={`font-bold text-deep-space-blue dark:text-papaya-whip text-sm ${disableProfileLink ? '' : 'group-hover/author:underline'}`}>
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
        
        {/* CONDITION pour désactiver le lien vers le profil */}
        {disableProfileLink ? (
          <div className="flex items-center gap-3">
            {userInfoContent}
          </div>
        ) : (
          <Link href={`/profile/${post.username}`} className="flex items-center gap-3 group/author cursor-pointer">
            {userInfoContent}
          </Link>
        )}

        {/* MENU DU POST 3 PETITS POINTS  */}
        <div className="relative">
          {/* bouton pour ouvrir/fermer */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-500 hover:text-deep-space-blue dark:hover:text-papaya-whip transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Si menu est ouvert, on affiche */}
          {isMenuOpen && (
            <>
              {/* Overlay invisible */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              ></div>

              {/* boîte */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/40 rounded-xl shadow-lg dark:shadow-[0_5px_20px_rgba(0,0,0,0.5)] z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Signaler */}
                <button 
                  onClick={() => {
                    alert(t('postCard.reportAlert').replace('{{username}}', post.username));
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-deep-space-blue dark:text-papaya-whip hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  {t('postCard.report')}
                </button>

                {/* Séparateur */}
                <hr className="border-gray-100 dark:border-white/10" />

                {/* Bloquer */}
                <button 
                  onClick={() => {
                    alert(t('postCard.blockAlert').replace('{{username}}', post.username));
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brick-red hover:bg-brick-red/10 dark:hover:bg-brick-red/40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  {t('postCard.block').replace('{{username}}', post.username)}
                </button>

              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-deep-space-blue dark:text-papaya-whip/90 mb-3 leading-relaxed">
        {post.content}
      </p>

      {post.imageUrl && (
        <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={post.imageUrl}
            alt={t('postCard.imageAlt')}
            className="w-full h-auto object-cover"
            onError={(e) => {
              // Repli local
              if (e.currentTarget.src.indexOf("/sample-post.jpg") === -1) {
                e.currentTarget.src = "/sample-post.jpg";
              }
            }}
          />
        </div>
      )}

      <div className="flex gap-6 mt-2 text-gray-500 dark:text-gray-400">
        
        {/* Bouton Commentaire */}
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

        {/* Bouton Like */}
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
    </article>
  );
}