"use client";

import PostCard from "../components/feed/PostCard";
import AppShell from "../components/layout/AppShell";

export default function FeedPage() {
  // TODO: remplacer par les données réelles du back-end
  const mockPosts = [
    {
      id: 1,
      username: "User1",
      time: "1h",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      likesCount: 12,
      commentsCount: 3,
    },
    {
      id: 2,
      username: "User2",
      time: "5min",
      content: "Regardez cette magnifique vue pour tester l'intégration des images ! 🌄",
      // Picsum, générateur d'images 
      imageUrl: "https://picsum.photos/800/400",
      likesCount: 45,
      commentsCount: 8,
    },
    {
      id: 3,
      username: "User67",
      time: "3d",
      content: "Lorem Ipsum pour tester le défilement : Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat ",
      likesCount: 0,
      commentsCount: 0,
    }
  ];

  return (
    <AppShell>
      {/* En-tête de section, collant en haut du feed sur desktop */}
      <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-deep-space-blue/80 backdrop-blur border-b border-gray-200 dark:border-white/10 px-4 py-3 hidden md:block">
        <h1 className="font-bold text-xl text-deep-space-blue dark:text-papaya-whip">Accueil</h1>
      </div>

      <div className="flex flex-col p-4 gap-4">
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </AppShell>
  );
}