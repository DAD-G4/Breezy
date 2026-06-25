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
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError(t('profile.loginRequired'));
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
        const ownerAvatar = u.profile?.avatar_url || null;
        const posts = userPosts.posts.map((p) =>
          mapPost(p, { authorLabel: displayName, authorHandle: u.username, avatarUrl: ownerAvatar, currentUserId: user.id, locale: language })
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
        if (active) setError(getApiErrorMessage(err, t('profile.loadError')));
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
          <ProfileView initialUser={profile} isOwnProfile={true} />
        )}
      </div>
    </AppShell>
  );
}
