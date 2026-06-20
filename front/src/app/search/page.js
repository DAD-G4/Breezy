"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { useRequireAuth } from "../../context/AuthContext";

export default function SearchPage() {
  useRequireAuth();
  // MOCK DATA A REMPLACER PLUS TARD PAR L'APPEL API
  const allUsers = [
    { id: 1, username: "User1", name: "Premier Utilisateur" },
    { id: 2, username: "User2", name: "Deuxième Utilisateur" },
    { id: 3, username: "Jane Doe", name: "Jane" },
    { id: 4, username: "ElonMusk", name: "Elon" },
    { id: 5, username: "Alice", name: "Alice Wonderland" },
    { id: 6, username: "Bob", name: "Bob l'éponge" },
  ];

  // Etats
  const [searchTerm, setSearchTerm] = useState("");

  // recherhe, A REMPLACER POUR LE BACK END
  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-6">

        {/* BARRE DE RECHERCHE */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {/* Icon Loupe */}
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Nom d'utilisateur..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue dark:focus:border-steel-blue focus:ring-2 focus:ring-steel-blue/20 transition-all shadow-sm"
          />
        </div>

        {/* RESULTATS */}
        <div className="flex flex-col gap-3">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <Link 
                key={user.id} 
                href={`/profile/${user.username}`}
                className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-steel-blue/20 bg-white dark:bg-deep-space-blue hover:shadow-md dark:hover:border-steel-blue/60 transition-all duration-200 group"
              >
                {/* Icon avatar */}
                <div className="w-12 h-12 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:opacity-90 transition-opacity">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                
                {/* Infos user */}
                <div className="flex flex-col flex-1 truncate">
                  <span className="font-bold text-deep-space-blue dark:text-papaya-whip text-base truncate group-hover:text-steel-blue transition-colors">
                    {user.username}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user.name}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            // Vide si aucune correspondance
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Aucun utilisateur trouvé pour "{searchTerm}"
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}