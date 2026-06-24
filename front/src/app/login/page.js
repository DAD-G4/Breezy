"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import BreezyBadge from "../../components/ui/BreezyBadge";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getApiErrorMessage } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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
      // POST /api/auth/login : stocke le JWT puis redirige vers le feed.
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(getApiErrorMessage(err, t('login.errorMessage')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
        <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        
        {/* Logo + titre masqués en mobile (téléphone) ; visibles dès md. */}
        <div className="mb-8 hidden md:flex flex-col items-center">
          <BreezyBadge className="w-40 h-40 drop-shadow-lg" />
          <span className="-mt-3 text-4xl font-extrabold tracking-wider text-deep-space-blue dark:text-steel-blue">
            BREEZY
          </span>
        </div>

        <div className="w-full max-w-sm border-2 border-deep-space-blue dark:border-white rounded-lg p-6 bg-white dark:bg-surface shadow-xl transition-colors duration-300">
          
          <h1 className="text-2xl font-bold text-center mb-6 pb-4 border-b-2 border-deep-space-blue/20 dark:border-white/20">
            Login
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
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
              <input
                type="password"
                required
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium"
              />
            </div>

            {/* Gestion erreur UI (Fx2) */}
            {error && (
              <div className="text-center text-brick-red font-semibold text-sm animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-full border-2 border-deep-space-blue dark:border-white font-bold text-lg hover:bg-deep-space-blue hover:text-white dark:hover:bg-white dark:hover:text-deep-space-blue transition-all disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('login.submitButton')}
            </button>

            <div className="mt-6 text-center text-sm font-semibold flex flex-col items-center">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="px-6 py-2 rounded-full border-2 border-deep-space-blue dark:border-white hover:bg-steel-blue hover:text-white hover:border-steel-blue transition-colors mb-2"
              >
                {t('login.registerButton')}
              </button>
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