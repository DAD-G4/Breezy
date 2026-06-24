"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import PostCard from "../feed/PostCard";
import { follow, unfollow, updateProfile } from "../../services/users";
import { upload } from "../../services/media";
import { report } from "../../services/moderation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import Toast from "../ui/Toast";

// composant reçoit les infos de base (initialUser) et un booléen (isOwnProfile)
export default function ProfileView({ initialUser, isOwnProfile }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [name, setName] = useState(initialUser.name);
  const [bio, setBio] = useState(initialUser.bio);
  const [avatarPreview, setAvatarPreview] = useState(initialUser.avatarUrl || null);
  const [profilePosts, setProfilePosts] = useState(initialUser.posts);

  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarChanged, setIsAvatarChanged] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);

  // récupère les stats de base, 0 par défaut
  const [followers, setFollowers] = useState(initialUser.followers || 0);
  const [following, setFollowing] = useState(initialUser.following || 0);
  const [isFollowing, setIsFollowing] = useState(initialUser.isFollowing || false); // Est-ce que l'utilisateur actuel folow ce profil ?
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [reported, setReported] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef(null);

  // Fx10 — Photo de profil : upload média puis sauvegarde de l'avatar_url.
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview); // aperçu immédiat
    setIsAvatarChanged(true);
    setPendingAvatarFile(file);
  };

  // Édition du nom / de la bio (propriétaire) : PUT /api/users/profile/:id
  const handleSaveName = async () => {
    try {
      await updateProfile(initialUser.id, { display_name: name });
    } catch (err) {
      console.error('[Profile] Failed to update name:', err);
      setName(initialUser.name);
    }
  };

  const handleSaveBio = async () => {
    try {
      await updateProfile(initialUser.id, { bio });
    } catch (err) {
      console.error('[Profile] Failed to update bio:', err);
      setBio(initialUser.bio);
    }
  };

  // Save all profile changes
  const handleSave = async () => {
    try {
      // Save name and bio
      await Promise.all([handleSaveName(), handleSaveBio()]);

      // Save avatar if changed
      if (isAvatarChanged && pendingAvatarFile) {
        const media = await upload(pendingAvatarFile);
        await updateProfile(initialUser.id, { avatar_url: media.url });
        setAvatarPreview(media.url);
      }

      setIsAvatarChanged(false);
      setPendingAvatarFile(null);
      setIsEditing(false);
    } catch (err) {
      console.error('[Profile] Failed to save profile:', err);
      setAvatarPreview(initialUser.avatarUrl || null);
      setIsAvatarChanged(false);
      setPendingAvatarFile(null);
    }
  };

  // Cancel editing and revert to original values
  const handleCancel = () => {
    setName(initialUser.name);
    setBio(initialUser.bio);
    setAvatarPreview(initialUser.avatarUrl || null);
    setIsAvatarChanged(false);
    setPendingAvatarFile(null);
    setIsEditing(false);
  };

  // Fx9 — Suivre/Ne plus suivre.
  //   follow   : POST   /api/users/follow/:id
  //   unfollow : DELETE /api/users/unfollow/:id
  // initialUser.id = id numérique du profil affiché (fourni par la couche data).
  // UI optimiste avec rollback si l'appel échoue.
  const handleFollowToggle = async () => {
    if (isFollowLoading) return; // prevent double-clicks

    const targetId = initialUser.id;
    const prevFollowing = isFollowing;
    const prevFollowers = followers;

    setIsFollowLoading(true);

    setIsFollowing(!prevFollowing);
    setFollowers(prevFollowing ? prevFollowers - 1 : prevFollowers + 1);

    try {
      if (prevFollowing) {
        await unfollow(targetId);
      } else {
        await follow(targetId);
      }
    } catch (err) {
      const status = err?.response?.status;

      if (!prevFollowing && status === 409) {
        // Already following — optimistic state (isFollowing=true) is correct, keep it
        console.info('[Profile] Already following, keeping state');
      } else {
        setIsFollowing(prevFollowing);
        setFollowers(prevFollowers);
        console.error('[Profile] Follow toggle failed:', err);
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Fx20 — Signaler un utilisateur.
  const handleReport = async () => {
    if (reported) return;
    try {
      await report({ targetType: "user", targetId: String(initialUser.id), reason: "Problématique" });
      setReported(true);
      setShowToast(true);
    } catch (err) {
      console.error('[ProfileView] Failed to report user:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="p-6 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-deep-space-blue shadow-sm dark:shadow-[0_0_15px_rgba(102,155,188,0.15)] transition-all flex flex-col gap-4">
        
        {/* Avatar + Nom à gauche et Bouton abonner/edit à droite */}
        <div className="flex justify-between items-center w-full">
          
          {/* Avatar et Nom */}
          <div className="flex items-center gap-4">
            <div 
              className={`relative group ${isOwnProfile ? "cursor-pointer" : ""}`} 
              onClick={() => isOwnProfile && fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full bg-steel-blue flex items-center justify-center text-white text-2xl font-bold border-2 border-white dark:border-deep-space-blue overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-20 object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* L'overlay apparaît QUE si isOwnProfile est true */}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
            </div>

            {/* Nom */}
            <div className="flex-1">
              {isEditing && isOwnProfile ? (
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1 text-lg font-bold rounded-lg bg-gray-100 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none border border-steel-blue"
                  autoFocus
                />
              ) : (
                <h1 className="text-2xl font-bold text-deep-space-blue dark:text-papaya-whip">{name}</h1>
              )}
            </div>
          </div>

          {/* Bouton Edit Profile / S'abonner */}
          {isOwnProfile ? (
            !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="ml-3 px-4 py-2 text-sm rounded-full font-bold transition-all duration-300 flex-shrink-0 bg-steel-blue text-white hover:bg-deep-space-blue shadow-md"
              >
                {t('profileView.editProfile')}
              </button>
            )
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={`ml-3 px-4 py-2 text-sm rounded-full font-bold transition-all duration-300 flex-shrink-0 ${
                  isFollowing 
                    ? "bg-gray-100 dark:bg-white/10 text-deep-space-blue dark:text-papaya-whip border border-gray-200 dark:border-white/20" 
                    : "bg-steel-blue text-white hover:bg-deep-space-blue shadow-md"
                } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isFollowing ? t('profileView.following') : t('profileView.follow')}
              </button>
              <button 
                onClick={handleReport}
                disabled={reported}
                className={`px-4 py-2 text-sm rounded-full font-bold transition-all duration-300 flex-shrink-0 ${
                  reported
                    ? "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-default"
                    : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                }`}
              >
                {reported ? t('profileView.reported') : t('profileView.report')}
              </button>
            </div>
          )}

        </div>

        {/* 2. STATISTIQUES */}
        <div className="flex gap-6 text-sm my-1">
          
          <Link 
            href={`/profile/${initialUser.username}/followers`}
            className="flex items-baseline gap-1.5 hover:opacity-70 transition-opacity"
          >
            <span className="font-bold text-base text-deep-space-blue dark:text-papaya-whip">{followers}</span>
            <span className="text-gray-500 dark:text-gray-400">{t('profileView.followersLabel')}</span>
          </Link>
          
          <Link 
            href={`/profile/${initialUser.username}/following`}
            className="flex items-baseline gap-1.5 hover:opacity-70 transition-opacity"
          >
            <span className="font-bold text-base text-deep-space-blue dark:text-papaya-whip">{following}</span>
            <span className="text-gray-500 dark:text-gray-400">{t('profileView.followingLabel')}</span>
          </Link>

        </div>

        <hr className="border-gray-200 dark:border-steel-blue/20" />

        {/* Bio */}
        <div>
          {isEditing && isOwnProfile ? (
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none border border-steel-blue resize-none min-h-[80px]"
              autoFocus
            />
          ) : (
            <p className="text-sm text-deep-space-blue/80 dark:text-papaya-whip/80 leading-relaxed whitespace-pre-wrap">
              {bio}
            </p>
          )}
        </div>

        {/* Save / Cancel buttons when editing */}
        {isEditing && isOwnProfile && (
          <div className="flex gap-3 justify-end">
            <button 
              onClick={handleCancel}
              className="px-4 py-2 text-sm rounded-lg font-bold transition-all duration-300 bg-gray-200 dark:bg-white/10 text-deep-space-blue dark:text-papaya-whip hover:bg-gray-300 dark:hover:bg-white/20"
            >
              {t('profileView.cancelButton')}
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm rounded-lg font-bold transition-all duration-300 bg-steel-blue text-white hover:bg-deep-space-blue shadow-md"
            >
              {t('profileView.saveButton')}
            </button>
          </div>
        )}

      </section>

      {/* Historique des posts */}
      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip px-2">
          {isOwnProfile ? t('profileView.yourPosts') : t('profileView.userPosts').replace('{{name}}', name)}
        </h2>
        {profilePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            disableProfileLink={true}
            currentUserId={user?.id}
            onDelete={(postId) => setProfilePosts((prev) => prev.filter((p) => p.id !== postId))}
            onUpdate={(postId, content) =>
              setProfilePosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content } : p)))
            }
          />
        ))}
      </section>

      {showToast && (
        <Toast message={t('toast.userReported')} />
      )}
    </div>
  );
}
