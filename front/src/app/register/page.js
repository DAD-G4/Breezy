"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BreezyBadge from "@/components/ui/BreezyBadge";
import { useLanguage } from "@/context/LanguageContext";

const inputClass =
  "w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium text-sm";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simulation - replace with: await axios.post("/api/auth/register", { displayName, username, email, password })
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/login");
    } catch (err) {
      /* ERREUR API */
      setError(t('register.errorMessage'));
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
            {t('register.title')}
          </h1>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              {/* INPUT DISPLAY NAME */}
              <input
                type="text"
                required
                placeholder={t('register.displayNamePlaceholder')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              {/* INPUT USERNAME */}
              <input
                type="text"
                required
                placeholder={t('register.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              {/* INPUT EMAIL */}
              <input
                type="email"
                required
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
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
                className={inputClass}
              />
            </div>

            {/* MESSAGE ERREUR */}
            {error && (
              <div className="text-center text-brick-red font-semibold text-sm animate-pulse pt-2">
                {error}
              </div>
            )}

            {/* BOUTON SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-full border-2 border-deep-space-blue dark:border-papaya-whip font-bold text-lg hover:bg-deep-space-blue hover:text-papaya-whip dark:hover:bg-papaya-whip dark:hover:text-deep-space-blue transition-all disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('register.submitButton')}
            </button>

            <div className="mt-4 text-center text-sm font-semibold flex flex-col items-center">
              {/* BOUTON LOGIN */}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="px-6 py-2 rounded-full border-2 border-deep-space-blue dark:border-papaya-whip hover:bg-steel-blue hover:text-white hover:border-steel-blue transition-colors mb-2 mt-4"
              >
                {t('register.loginButton')}
              </button>
              
              {/* TEXTE AIDE */}
              <span className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {t('register.alreadyHaveAccount')}
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}