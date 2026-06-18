export default function PostCard({ post }) {
  // ce composant reçoit une prop 'post' qui contient les data du message (ex: post.username, post.content, post.time, etc....)

  return (
    // Conteneur principal de la carte
    <article className="p-4 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-deep-space-blue shadow-sm dark:shadow-[0_0_15px_rgba(102,155,188,0.15)] hover:dark:shadow-[0_0_25px_rgba(102,155,188,0.35)] hover:dark:border-steel-blue/70 transition-all duration-300">
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          
          {/* On ajoute un mini-glow autour de l'avatar pour faire ressortir l'utilisateur */}
          <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold dark:shadow-[0_0_10px_rgba(102,155,188,0.5)]">
            {post.username.charAt(0).toUpperCase()}
          </div>
          
          {/* Nom et temps depuis le post */}
          <div className="flex flex-col">
            <span className="font-bold text-deep-space-blue dark:text-papaya-whip text-sm">
              {post.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {post.time}
            </span>
          </div>
        </div>

        {/* Options (3 ptits points) */}
        <button className="text-gray-500 hover:text-deep-space-blue dark:hover:text-papaya-whip transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* CORPS (Texte) */}
      <p className="text-sm text-deep-space-blue dark:text-papaya-whip/90 mb-3 leading-relaxed">
        {post.content}
      </p>

      {/* IMAGE (Fx18)*/}
      {/* Si le post contient une image on l'affiche */}
      {post.imageUrl && (
        <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <img src={post.imageUrl} alt="Contenu du post" className="w-full h-auto object-cover" />
        </div>
      )}

      {/* BARRE D'ACTIONS Likes & Commentaires - Fx6, Fx7*/}
      <div className="flex gap-6 mt-2 text-gray-500 dark:text-gray-400">
        
        {/* Bouton commentaire */}
        <button className="flex items-center gap-1.5 hover:text-steel-blue transition-colors group">
          <div className="p-1.5 rounded-full group-hover:bg-steel-blue/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xs font-medium">{post.commentsCount || 0}</span>
        </button>

        {/* Bouton like */}
        <button className="flex items-center gap-1.5 hover:text-brick-red transition-colors group">
          <div className="p-1.5 rounded-full group-hover:bg-brick-red/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium">{post.likesCount || 0}</span>
        </button>

      </div>
    </article>
  );
}