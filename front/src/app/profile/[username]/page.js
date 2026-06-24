"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import ProfileView from "@/components/profile/ProfileView";
import { getApiErrorMessage } from "@/lib/api";
import { mapPost } from "@/lib/mappers";
import { getProfileByUsername } from "@/services/users";
import { getUserPosts } from "@/services/posts";
import { useAuth, useRequireAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function PublicProfilePage({ params }) {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Résolution username → profil complet (id réel requis par Fx9 Suivre).
        const u = await getProfileByUsername(username);
        const displayName = u.profile?.display_name || u.username;

        // Posts publics de cet utilisateur.
        const userPosts = await getUserPosts(u.id);
        const ownerAvatar = u.profile?.avatar_url || null;
        const posts = (userPosts.posts || []).map((p) =>
          mapPost(p, { authorLabel: displayName, avatarUrl: ownerAvatar, currentUserId: user?.id, locale: language })
        );

        if (active) {
          setProfile({
            id: u.id,
            username: u.username,
            name: displayName,
            bio: u.profile?.bio || "",
            avatarUrl: u.profile?.avatar_url || null,
            followers: u.followers_count ?? 0,
            following: u.following_count ?? 0,
            posts,
          });
        }
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, t('profile.notFound')));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [username, user]);

  return (
    <AppShell>
      <div className="p-4 flex flex-col gap-4">
        {/* fleche retour */}
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all w-fit"
            aria-label={t('common.back')}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {loading && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.loading')}</p>
        )}
        {!loading && error && (
          <p className="text-center text-brick-red font-semibold py-8">{error}</p>
        )}
        {!loading && !error && profile && (
          <ProfileView initialUser={profile} isOwnProfile={user?.id === profile.id} />
        )}
      </div>
    </AppShell>
  );
}
