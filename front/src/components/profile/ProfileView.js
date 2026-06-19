"use client";

import { useState, useRef } from "react";
import PostCard from "../feed/PostCard";

// composant reçoit les infos de base (initialUser) et un booléen (isOwnProfile)
export default function ProfileView({ initialUser, isOwnProfile }) {
  const [name, setName] = useState(initialUser.name);
  const [bio, setBio] = useState(initialUser.bio);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="p-6 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-deep-space-blue shadow-sm dark:shadow-[0_0_15px_rgba(102,155,188,0.15)] transition-all flex flex-col gap-4">
        
        {/* Avatar et Nom */}
        <div className="flex items-center gap-4">
          <div 
            className={`relative group ${isOwnProfile ? "cursor-pointer" : ""}`} 
            onClick={() => isOwnProfile && fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 rounded-full bg-steel-blue flex items-center justify-center text-white text-2xl font-bold border-2 border-white dark:border-deep-space-blue overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
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
            {isEditingName && isOwnProfile ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-1 text-lg font-bold rounded-lg bg-gray-100 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none border border-steel-blue"
                  autoFocus
                />
                <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-steel-blue text-white rounded-lg hover:bg-deep-space-blue transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-bold text-deep-space-blue dark:text-papaya-whip">{name}</h1>
                {/* Modifier apparait QUE si isOwnProfile est true */}
                {isOwnProfile && (
                  <button onClick={() => setIsEditingName(true)} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-steel-blue transition-all" aria-label="Éditer le nom">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <hr className="border-gray-200 dark:border-steel-blue/20" />

        {/* Bio */}
        <div>
          {isEditingBio && isOwnProfile ? (
            <div className="flex flex-col gap-2">
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none border border-steel-blue resize-none min-h-[80px]"
                autoFocus
              />
              <button onClick={() => setIsEditingBio(false)} className="self-end px-4 py-1.5 bg-steel-blue text-white text-sm font-bold rounded-lg hover:bg-deep-space-blue transition-colors">
                Sauvegarder
              </button>
            </div>
          ) : (
            <div className="relative group">
              <p className="text-sm text-deep-space-blue/80 dark:text-papaya-whip/80 leading-relaxed pr-6 whitespace-pre-wrap">
                {bio}
              </p>
              {isOwnProfile && (
                <button onClick={() => setIsEditingBio(true)} className="absolute top-0 right-0 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-steel-blue transition-all bg-white dark:bg-deep-space-blue pl-1" aria-label="Éditer la bio">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Historique des posts */}
      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip px-2">
          {isOwnProfile ? "Vos posts :" : `Posts de ${name} :`}
        </h2>
        {initialUser.posts.map((post) => (
          <PostCard key={post.id} post={post} disableProfileLink={true} />
        ))}
      </section>
    </div>
  );
}