"use client"; //on utilise un hook useTheme

import { useState } from "react";
import axios from "axios";
// useRouter pour rediriger le user apres la connexion
import { useRouter } from "next/navigation"; 

export default function LoginPage() {   // Composant de la page de connexion
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {    // gerer la soumission du formulaire
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simulation de l'appel API (à remplacer par la vraie URL back-end)
      // const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      
      // Faux délai pour tester l'UI de chargement
      await new Promise((resolve) => setTimeout(resolve, 1500)); 
      
      // Stockage du Token JWT (simulation)
      // localStorage.setItem("token", response.data.token);

      // Redirection vers le Feed apres connexion
      router.push("/"); 
    } catch (err) {
      setError("Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/*Barre de navigation */}
      <header className="flex justify-between items-center p-4 border-b border-deep-space-blue/20 dark:border-papaya-whip/20">
        <button className="p-2" aria-label="Menu">
          {/* Menu burger (SVG)*/}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button className="p-2" aria-label="Infos">
          {/* Icône Info (SVG) */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        
        {/* Logo (a remplacer par le logo Breezy) */}
        <div className="mb-8 w-16 h-16 bg-deep-space-blue dark:bg-papaya-whip text-papaya-whip dark:text-deep-space-blue rounded-full flex items-center justify-center text-4xl shadow-lg">
          🍃
        </div>

        {/* Bloc du Formulaire */}
        <div className="w-full max-w-sm border-2 border-deep-space-blue dark:border-papaya-whip rounded-lg p-6 bg-white dark:bg-deep-space-blue shadow-xl transition-colors duration-300">
          
          <h1 className="text-2xl font-bold text-center mb-6 pb-4 border-b-2 border-deep-space-blue/20 dark:border-papaya-whip/20">
            Login
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            {/*  Adresse Mail */}
            <div>
              <input
                type="email"
                required
                placeholder="adresse mail :"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium"
              />
            </div>

            {/*  Mot de passe */}
            <div>
              <input
                type="password"
                required
                placeholder="mot de passe :"
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

            {/* Bouton de connexion  */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-full border-2 border-deep-space-blue dark:border-papaya-whip font-bold text-lg hover:bg-deep-space-blue hover:text-papaya-whip dark:hover:bg-papaya-whip dark:hover:text-deep-space-blue transition-all disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Se Connecter"}
            </button>

            {/* Lien d'inscription */}
            <div className="mt-6 text-center text-sm font-semibold flex flex-col items-center">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="px-6 py-2 rounded-full border-2 border-deep-space-blue dark:border-papaya-whip hover:bg-steel-blue hover:text-white hover:border-steel-blue transition-colors mb-2"
              >
                S'inscrire
              </button>
              <span className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Pas encore de compte ?
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}