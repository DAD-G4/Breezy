"use client";
import { use } from "react";
import { useRouter } from "next/navigation"; 

import AppShell from "@/components/layout/AppShell";
import ProfileView from "@/components/profile/ProfileView";

export default function PublicProfilePage({ params }) {
  const router = useRouter(); // innitialisation du router pour la navigation

  // On utilise le hook use() pour récupérer les paramètres de l'URL commme le nom d'utilisateur
  const resolvedParams = use(params);
  
  // On extrait la variable username de l'objet avec decodeURIComponent pour gérer les caractères spéciaux dans l'URL
  const username = decodeURIComponent(resolvedParams.username);

  // sécurité = on s'assure que username a une valeur par défaut 
  const safeUsername = username || "Utilisateur Inconnu";

  const publicUserData = {
    // TODO (couche data) : remplacer par l'id numérique réel du profil
    // (résolu depuis le username via GET /api/users/...). Requis par Fx9 (Suivre).
    id: null,
    name: safeUsername,
    bio: `Salut ! Je suis ${safeUsername} et ceci est mon profil public.`,
    followers: 42,
    following: 150,
    posts: [
      { id: 201, username: safeUsername, time: "2h", content: "Un post sur mon profil public.", likesCount: 5, commentsCount: 1 }
    ]
  };

  return (
    <AppShell>
      <div className="p-4 flex flex-col gap-4">

        {/* fleche retour*/}
        <button 
          onClick={() => router.back()} 
          className="p-2 -ml-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all w-fit"
          aria-label="Retour"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <ProfileView initialUser={publicUserData} isOwnProfile={false} />
      </div>
    </AppShell>
  );
}