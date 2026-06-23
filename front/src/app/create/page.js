"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell";
import { getApiErrorMessage } from "../../lib/api";
import { createPost } from "../../services/posts";
import { upload } from "../../services/media";
import { useRequireAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function CreatePostPage() {
  useRequireAuth();
  const router = useRouter();
  const { t } = useLanguage();

  // etats du formulaire
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // "image" | "video"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // simuler le clic sur l'input file caché
  const fileInputRef = useRef(null);

  // gérer l'ajout d'un média image OU vidéo (aperçu local + fichier conservé)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setMediaType(file.type.startsWith("video") ? "video" : "image");
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setMediaType(null);
    setImagePreview(null);
  };

  // soumission de post (Fx3) — upload média éventuel puis création du post.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let media = null;

      // 1. Upload de l'image si présente.
      if (imageFile) {
        const { url, type } = await upload(imageFile);
        media = { url, type };
      }

      // 2. Création du post.
      await createPost({ content, media });

      // Retour feed apres publication
      router.push("/");
    } catch (err) {
      setError(getApiErrorMessage(err, t('createPost.error')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-4">

        {/* En-tête avec bouton retour et Titre */}
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={() => router.back()}
            className="p-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
            aria-label={t('common.back')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="font-bold text-xl text-deep-space-blue dark:text-papaya-whip">
            {t('createPost.title')}
          </h1>
        </div>

        {/* Carte de création */}
        <form 
          onSubmit={handleSubmit} 
          className="p-4 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-deep-space-blue shadow-sm dark:shadow-[0_0_15px_rgba(102,155,188,0.15)] flex flex-col gap-4 transition-all"
        >
          
          {/* Section Utilisateur A REDIRIGER VERS L'USER PROFILE */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold dark:shadow-[0_0_10px_rgba(102,155,188,0.5)]">
              M
            </div>
              <span className="font-bold text-deep-space-blue dark:text-papaya-whip text-sm">
                {t('common.me')}
            </span>
          </div>

          {/* Zone de texte */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('createPost.placeholder')}
            className="w-full bg-transparent resize-none outline-none text-deep-space-blue dark:text-papaya-whip placeholder:text-gray-400 min-h-[120px] text-lg"
            required={!imagePreview} // uniquement s'il y a pas d'image
          />

          {/* Aperçu du média (image ou vidéo) */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mt-2">
              {mediaType === "video" ? (
                <video src={imagePreview} controls className="w-full h-auto max-h-[420px] bg-black" />
              ) : (
                <img src={imagePreview} alt={t('createPost.imagePreviewAlt')} className="w-full h-auto object-cover" />
              )}
              {/* retirer le média */}
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-brick-red transition-colors"
                aria-label={t('common.removeImage')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Message d'erreur API */}
          {error && (
            <p className="text-center text-brick-red font-semibold text-sm">{error}</p>
          )}

          {/* Barre d'outils et bouton Publier */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/10 mt-2">
            
            {/* Outils */}
            <div className="flex gap-2 text-steel-blue">
              
              {/* Ajout d'Image */}
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors group"
                title={t('createPost.tools.addImage')}
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* Input de fichier caché */}
              <input
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Bouton Soumission */}
            <button 
              type="submit" 
              disabled={isLoading || (!content.trim() && !imagePreview)}
              className="px-6 py-2.5 bg-steel-blue hover:bg-deep-space-blue dark:bg-papaya-whip dark:text-deep-space-blue dark:hover:bg-white text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? t('createPost.submit.loading') : t('createPost.submit.default')}
            </button>

          </div>
        </form>
      </div>
    </AppShell>
  );
} 