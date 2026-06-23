"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BreezyBadge from "@/components/ui/BreezyBadge";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); 
      router.push("/"); 
    } catch (err) {
      /* ERREUR API */
      setError(t('login.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        
        <div className="mb-8">
          <BreezyBadge className="w-24 h-24 drop-shadow-lg" />
        </div>

        <div className="w-full max-w-sm border-2 border-deep-space-blue dark:border-papaya-whip rounded-lg p-6 bg-white dark:bg-deep-space-blue shadow-xl transition-colors duration-300">
          
          {/* TITRE */}
          <h1 className="text-2xl font-bold text-center mb-6 pb-4 border-b-2 border-deep-space-blue/20 dark:border-papaya-whip/20">
            {t('login.title')}
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              {/* INPUT EMAIL */}
              <input
                type="email"
                required
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium"
              />
            </div>

            <div>
              {/* INPUT PASSWORD */}
              <input
                type="password"
                required
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium"
              />
            </div>

            {/* MESSAGE ERREUR */}
            {error && (
              <div className="text-center text-brick-red font-semibold text-sm animate-pulse">
                {error}
              </div>
            )}

            {/* BOUTON SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-full border-2 border-deep-space-blue dark:border-papaya-whip font-bold text-lg hover:bg-deep-space-blue hover:text-papaya-whip dark:hover:bg-papaya-whip dark:hover:text-deep-space-blue transition-all disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('login.submitButton')}
            </button>

            <div className="mt-6 text-center text-sm font-semibold flex flex-col items-center">
              {/* BOUTON INSCRIPTION */}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="px-6 py-2 rounded-full border-2 border-deep-space-blue dark:border-papaya-whip hover:bg-steel-blue hover:text-white hover:border-steel-blue transition-colors mb-2"
              >
                {t('login.registerButton')}
              </button>
              
              {/* TEXTE AIDE */}
              <span className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {t('login.noAccount')}
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}