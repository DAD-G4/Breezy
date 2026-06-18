"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  // useRouter permet de rediriger le user vers login apres connexion
  const router = useRouter();
  
  // On stocke ce que l'utilisateur rentre dans chaque champ
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // INTERFACE (UI)
  const [error, setError] = useState(""); // stocker et afficher  message d'erreur 
  const [loading, setLoading] = useState(false); // désactiver le bouton de soumission pendant le chargement...

  // Fonction de soumission inscription
  // déclenche quand le user clique sur le bouton "S'inscrire"
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // on active l'état de chargement (le bouton affiche Chargement...)

    try {
      // Simulation d'un appel réseau vers la Couche Proxy (API Gateway) A REMPLACER PAR L'URL DU BACK-END
      // En production, tu auras : await axios.post("http://localhost:5000/api/auth/register", { displayName, username, email, password })
      
      await new Promise((resolve) => setTimeout(resolve, 1500)); 
      
      // Si le serveur répond avec succès ->> on redirige l'utilisateur vers la page de connexion
      router.push("/login"); 
    } catch (err) {
      // Si le serveur renvoie une erreur
      setError("Erreur lors de l'inscription. Veuillez vérifier vos informations.");
    } finally {
      // Quoi qu'il arrive (succès ou erreur), on arrête l'animation de loading
      setLoading(false);
    }
  };

  // HTML / JSX 
  return (
    // Conteneur principal toute la hauteur de l'ecran (min-h-screen)
    <div className="flex flex-col min-h-screen">
      
      {/* HEADER*/}
      {/* navbar */}
      <header className="flex justify-between items-center p-4 border-b border-deep-space-blue/20 dark:border-papaya-whip/20">
        <button className="p-2" aria-label="Menu">
          {/* menu burger */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button className="p-2" aria-label="Infos">
          {/* Icone info*/}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {/* Bloc principal */}
      {/* prend tout l'espace restant sous le header */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        
    {/* Logo A REMPLACER PAR LE LOGO DE L'APPLICATION */}
        <div className="mb-8 w-16 h-16 bg-deep-space-blue dark:bg-papaya-whip text-papaya-whip dark:text-deep-space-blue rounded-full flex items-center justify-center text-4xl shadow-lg">
          🍃
        </div>

        {/* Bloc formulaire*/}
        <div className="w-full max-w-sm border-2 border-deep-space-blue dark:border-papaya-whip rounded-lg p-6 bg-white dark:bg-deep-space-blue shadow-xl transition-colors duration-300">
          
          <h1 className="text-2xl font-bold text-center mb-6 pb-4 border-b-2 border-deep-space-blue/20 dark:border-papaya-whip/20">
            Register
          </h1>

          {/* formulaire */}
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Nom d'affichage */}
            <div>
              <input
                type="text"
                required
                placeholder="nom d'affichage :"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)} // Met à jour l'état à chaque frappe
                className="w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium text-sm"
              />
            </div>

            {/* Identifiant (@) */}
            <div>
              <input
                type="text"
                required
                placeholder="Identifiant (@) :"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                required
                placeholder="adresse mail :"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium text-sm"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <input
                type="password"
                required
                placeholder="mot de passe :"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-steel-blue focus:outline-none transition-colors placeholder:text-gray-400 font-medium text-sm"
              />
            </div>

            {/* Affichage de l'erreur UI */}
            {/* on affiche ce bloc d'alerte error */}
            {error && (
              <div className="text-center text-brick-red font-semibold text-sm animate-pulse pt-2">
                {error}
              </div>
            )}

            {/* bouton de soumission */}
            <button
              type="submit"
              disabled={loading} // Se désactive si requete est en cours
              className="w-full py-3 mt-4 rounded-full border-2 border-deep-space-blue dark:border-papaya-whip font-bold text-lg hover:bg-deep-space-blue hover:text-papaya-whip dark:hover:bg-papaya-whip dark:hover:text-deep-space-blue transition-all disabled:opacity-50"
            >
              {loading ? "Chargement..." : "S'inscrire"}
            </button>

            {/* Zone de redirection vers Login */}
            <div className="mt-4 text-center text-sm font-semibold flex flex-col items-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="px-6 py-2 rounded-full border-2 border-deep-space-blue dark:border-papaya-whip hover:bg-steel-blue hover:text-white hover:border-steel-blue transition-colors mb-2 mt-4"
              >
                Login
              </button>
              <span className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Vous avez déjà un compte ?
              </span>
            </div>
            
          </form>
        </div>
      </main>
    </div>
  );
}