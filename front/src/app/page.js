"use client";

import PostCard from "../components/feed/PostCard";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";

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
    <div className="flex flex-col min-h-screen pb-20">
      <Header />

      <main className="flex-1 flex flex-col p-4 gap-4">
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </main> 
      <BottomNav />
    </div>
  );
}