"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function CreatePostPage() {
  const router = useRouter();
  
  // etats du formulaire
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // simuler le clic sur l'input file caché
  const fileInputRef = useRef(null);

  // gérer l'ajout d'une image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Crée une URL temporaire pour afficher l'image instantanément A REMPLACER PAR UN UPLOAD VERS LE BACK-END
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // soumission de post (Fx3)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulation d'envoi au back-end A REMPLACER PAR UN APPEL API VERS LE BACK-END
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retour feed apres publication
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la publication");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col p-4 gap-4">
        
        {/* En-tête avec bouton retour et Titre */}
        <div className="flex items-center gap-1 mb-2">
          <button 
            onClick={() => router.back()} 
            className="p-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
            aria-label="Retour"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="font-bold text-xl text-deep-space-blue dark:text-papaya-whip">
            Nouvelle publication
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
              Moi
            </span>
          </div>

          {/* Zone de texte */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf sur Breezy ?"
            className="w-full bg-transparent resize-none outline-none text-deep-space-blue dark:text-papaya-whip placeholder:text-gray-400 min-h-[120px] text-lg"
            required={!imagePreview} // uniquement s'il y a pas d'image
          />

          {/* Aperçu de l'image */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mt-2">
              <img src={imagePreview} alt="Aperçu" className="w-full h-auto object-cover" />
              {/* retirer l'image */}
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-brick-red transition-colors"
                aria-label="Supprimer l'image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
                title="Ajouter une image"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* Input de fichier caché */}
              <input 
                type="file" 
                accept="image/*" 
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
              {isLoading ? "Publication..." : "Publier"}
            </button>

          </div>
        </form>
      </main>
      
      <BottomNav />
    </div>
  );
} 