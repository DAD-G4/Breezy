"use client";

import AppShell from "@/components/layout/AppShell";
import ProfileView from "@/components/profile/ProfileView";
import { useLanguage } from "@/context/LanguageContext";

export default function MyProfilePage() {
  const { t } = useLanguage();

  // Mock data, A REMPLACER PAR UN APPEL API
  const myData = {
    name: "Jane Doe",
    /* BIO */
    bio: t('myProfile.bio'),
    followers: 1240, 
    following: 89,   
    posts: [
      /* POST 1 */
      { id: 101, username: "Jane Doe", time: "1h", content: t('myProfile.post1'), likesCount: 120, commentsCount: 15 },
      /* POST 2 */
      { id: 102, username: "Jane Doe", time: "5d", content: t('myProfile.post2'), likesCount: 42, commentsCount: 3 }
    ]
  };

  return (
    <AppShell>
      <div className="p-4">
        {/* COMPOSANT PROFIL */}
        <ProfileView initialUser={myData} isOwnProfile={true} />
      </div>
    </AppShell>
  );
}