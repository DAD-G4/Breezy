"use client";
import { use } from "react";
import { useRouter } from "next/navigation"; 

import AppShell from "@/components/layout/AppShell";
import ProfileView from "@/components/profile/ProfileView";
import { useLanguage } from "@/context/LanguageContext";

export default function PublicProfilePage({ params }) {
  const router = useRouter(); 
  const { t } = useLanguage();

  // On utilise le hook use() pour récupérer les paramètres de l'URL
  const resolvedParams = use(params);
  
  // On extrait la variable username
  const username = decodeURIComponent(resolvedParams.username);

  // USERNAME SÉCURISÉ
  const safeUsername = username || t('publicProfile.unknownUser');

  // MOCK DATA 
  const publicUserData = {
    name: safeUsername,
    /* BIO DYNAMIQUE */
    bio: t('publicProfile.defaultBio').replace('{{name}}', safeUsername),
    followers: 42,
    following: 150,
    posts: [
      { id: 201, username: safeUsername, time: "2h", content: t('publicProfile.defaultPost'), likesCount: 5, commentsCount: 1 }
    ]
  };

  return (
    <AppShell>
      <div className="p-4 flex flex-col gap-4">

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

        <ProfileView initialUser={publicUserData} isOwnProfile={false} />
      </div>
    </AppShell>
  );
}