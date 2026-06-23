"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import ProfileView from "../../components/profile/ProfileView";
import { getApiErrorMessage } from "../../lib/api";
import { mapPost } from "../../lib/mappers";
import { getProfile } from "../../services/users";
import { getUserPosts } from "../../services/posts";
import { useAuth, useRequireAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function MyProfilePage() {
  useRequireAuth();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError("Connectez-vous pour voir votre profil.");
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Profil + posts de l'utilisateur connecté (id issu du JWT stocké).
        const [u, userPosts] = await Promise.all([
          getProfile(user.id),
          getUserPosts(user.id),
        ]);

        const displayName = u.profile?.display_name || u.username;
        const posts = userPosts.posts.map((p) =>
          mapPost(p, { authorLabel: displayName, currentUserId: user.id, locale: language })
        );

        if (active) {
          setProfile({
            id: u.id,
            name: displayName,
            bio: u.profile?.bio || "",
            avatarUrl: u.profile?.avatar_url || null,
            followers: u.followers_count ?? 0,
            following: u.following_count ?? 0,
            posts,
          });
        }
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, "Impossible de charger le profil."));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  return (
    <AppShell>
      <div className="p-4">
        {loading && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.loading')}</p>
        )}
        {!loading && error && (
          <p className="text-center text-brick-red font-semibold py-8">{error}</p>
        )}
        {!loading && !error && profile && (
          <>
            <ProfileView initialUser={profile} isOwnProfile={true} />

            {/* Déconnexion (visible aussi sur mobile via la bottom nav) */}
            <button
              onClick={logout}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-brick-red border border-brick-red/40 hover:bg-brick-red/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Se déconnecter
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
