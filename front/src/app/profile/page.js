"use client";

import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import ProfileView from "../../components/profile/ProfileView";

export default function MyProfilePage() {
  // Mock data, A REMPLACER PAR UN APPEL API VERS LE BACK-END POUR RÉCUPÉRER LES DONNÉES DE L'UTILISATEUR CONNECTÉ
  const myData = {
    name: "Jane Doe",
    bio: "Développeuse Front-End passionnée 🍃. J'adore créer des interfaces fluides !",
    posts: [
      { id: 101, username: "Jane Doe", time: "1h", content: "Je viens de terminer l'intégration !", likesCount: 120, commentsCount: 15 },
      { id: 102, username: "Jane Doe", time: "5d", content: "Premier post sur Breezy.", likesCount: 42, commentsCount: 3 }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header />
      <main className="flex-1 p-4">
        {/* On appelle le composant en précisant le profil de l'utilisateur */}
        <ProfileView initialUser={myData} isOwnProfile={true} />
      </main>
      <BottomNav />
    </div>
  );
}