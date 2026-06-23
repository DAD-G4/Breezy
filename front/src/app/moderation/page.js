"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/context/LanguageContext";

export default function ModerationPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("reports"); // "reports" | "users"
  
  // NOUVEAU : État pour le filtre des utilisateurs
  const [userFilter, setUserFilter] = useState("all"); // "all" | "active" | "suspended" | "banned"

  // MOCK DATA - Signalements (Fx20)
  const [reports, setReports] = useState([
    { id: 1, postAuthor: "User67", reporter: "Alice", reason: "Spam", content: "Achetez des cryptos maintenant !!!", status: "pending" },
    { id: 2, postAuthor: "Troll99", reporter: "Bob", reason: "Harcèlement", content: "T'es vraiment nul en dev...", status: "pending" }
  ]);

  // MOCK DATA - Utilisateurs (Fx21)
  const [users, setUsers] = useState([
    { id: 1, username: "User67", status: "active", reportsCount: 3 },
    { id: 2, username: "Troll99", status: "suspended", reportsCount: 12 },
    { id: 3, username: "SpammerO1", status: "banned", reportsCount: 50 }
  ]);

  // Actions de modération simulées
  const handleDeletePost = (id) => {
    alert(`Le post a été supprimé.`);
    setReports(reports.filter(r => r.id !== id));
  };

  const handleIgnoreReport = (id) => {
    setReports(reports.filter(r => r.id !== id));
  };

  const handleUpdateUserStatus = (id, newStatus) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
  };

  // NOUVEAU : Logique de filtrage des utilisateurs
  const filteredUsers = userFilter === "all" 
    ? users 
    : users.filter(user => user.status === userFilter);

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-6">
        
        {/* EN-TÊTE DE MODÉRATION */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-steel-blue/40">
          <div className="p-3 bg-brick-red/10 rounded-full text-brick-red">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-space-blue dark:text-papaya-whip">
              {t('moderation.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('moderation.subtitle')}
            </p>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-steel-blue/40">
          <button 
            onClick={() => setActiveTab("reports")}
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "reports" ? "text-steel-blue" : "text-gray-500 hover:text-deep-space-blue dark:hover:text-papaya-whip"}`}
          >
            {t('moderation.tabReports')} ({reports.length})
            {activeTab === "reports" && <span className="absolute bottom-0 left-0 w-full h-1 bg-steel-blue rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "users" ? "text-steel-blue" : "text-gray-500 hover:text-deep-space-blue dark:hover:text-papaya-whip"}`}
          >
            {t('moderation.tabUsers')}
            {activeTab === "users" && <span className="absolute bottom-0 left-0 w-full h-1 bg-steel-blue rounded-t-full"></span>}
          </button>
        </div>

        {/* CONTENU : SIGNALEMENTS (Fx20) */}
        {activeTab === "reports" && (
          <div className="flex flex-col gap-4">
            {reports.length === 0 ? (
              <p className="text-center py-10 text-gray-500">{t('moderation.noReports')}</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-deep-space-blue shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-brick-red/10 text-brick-red text-xs font-bold rounded-full">
                      {report.reason}
                    </span>
                    <span className="text-xs text-gray-500">Signalé par @{report.reporter}</span>
                  </div>
                  <p className="text-sm font-medium text-deep-space-blue dark:text-papaya-whip mt-2 mb-1">Auteur : @{report.postAuthor}</p>
                  <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-100 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 italic mb-4">
                    "{report.content}"
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleIgnoreReport(report.id)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                      {t('moderation.ignore')}
                    </button>
                    <button onClick={() => handleDeletePost(report.id)} className="px-4 py-2 text-sm font-bold text-white bg-brick-red hover:bg-red-700 rounded-lg transition-colors shadow-sm">
                      {t('moderation.deletePost')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CONTENU : UTILISATEURS (Fx21) */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            
            {/* NOUVEAU : UI DU FILTRE UTILISATEURS */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/10">
              <span className="text-sm font-bold text-deep-space-blue dark:text-papaya-whip">
                {t('moderation.filterStatus')}
              </span>
              <select 
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="text-sm bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/40 rounded-lg px-3 py-1.5 outline-none text-deep-space-blue dark:text-papaya-whip cursor-pointer shadow-sm"
              >
                <option value="all">{t('moderation.filterAll')}</option>
                <option value="active">{t('moderation.statusActive')}</option>
                <option value="suspended">{t('moderation.statusSuspended')}</option>
                <option value="banned">{t('moderation.statusBanned')}</option>
              </select>
            </div>

            {/* LISTE FILTRÉE */}
            <div className="flex flex-col gap-3">
              {filteredUsers.length === 0 ? (
                <p className="text-center py-10 text-gray-500">{t('moderation.noUsers')}</p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-deep-space-blue shadow-sm">
                    
                    <div className="flex flex-col">
                      <span className="font-bold text-deep-space-blue dark:text-papaya-whip">@{user.username}</span>
                      <span className="text-xs text-gray-500">{user.reportsCount} signalement(s)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Badge de statut */}
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        user.status === "active" ? "bg-green-100 text-green-700" :
                        user.status === "suspended" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {user.status === "active" ? t('moderation.statusActive') : 
                         user.status === "suspended" ? t('moderation.statusSuspended') : 
                         t('moderation.statusBanned')}
                      </span>

                      {/* Actions rapides */}
                      <select 
                        value={user.status}
                        onChange={(e) => handleUpdateUserStatus(user.id, e.target.value)}
                        className="text-sm bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-steel-blue/40 rounded-lg px-2 py-1.5 outline-none text-deep-space-blue dark:text-papaya-whip cursor-pointer"
                      >
                        <option value="active">{t('moderation.actionActive')}</option>
                        <option value="suspended">{t('moderation.actionSuspend')}</option>
                        <option value="banned">{t('moderation.actionBan')}</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}