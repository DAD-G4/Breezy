"use client";
import { use } from "react";

import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ProfileView from "@/components/profile/ProfileView";

export default function PublicProfilePage({ params }) {
  // On utilise le hook use() pour récupérer les paramètres de l'URL commme le nom d'utilisateur
  const resolvedParams = use(params);
  
  // On extrait la variable username de l'objet avec decodeURIComponent pour gérer les caractères spéciaux dans l'URL
  const username = decodeURIComponent(resolvedParams.username);

  // sécurité = on s'assure que username a une valeur par défaut 
  const safeUsername = username || "Utilisateur Inconnu";

  const publicUserData = {
    name: safeUsername,
    bio: `Salut ! Je suis ${safeUsername} et ceci est mon profil public.`,
    posts: [
      { id: 201, username: safeUsername, time: "2h", content: "Un post sur mon profil public.", likesCount: 5, commentsCount: 1 }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header />
      <main className="flex-1 p-4">
        {/* On appelle le composant, mais isOwnProfile est false */}
        <ProfileView initialUser={publicUserData} isOwnProfile={false} />
      </main>
      <BottomNav />
    </div>
  );
}