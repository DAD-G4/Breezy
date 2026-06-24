"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/lib/api";
import { listReports, resolveReport, banUser, unbanUser, listUsers } from "@/services/moderation";
import { getPost, deletePost } from "@/services/posts";
import { resolveUsers } from "@/services/users";
import { adminRegister } from "@/services/auth";
import { useRequireAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ModerationPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("reports");
  const [userFilter, setUserFilter] = useState("all");
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [accountForm, setAccountForm] = useState({ username: "", email: "", password: "", role: "user" });
  const [accountSuccess, setAccountSuccess] = useState("");
  const [accountError, setAccountError] = useState("");

  const isStaff = user?.role === "moderator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!loading && user && !isStaff) {
      router.replace("/");
    }
  }, [loading, user, isStaff, router]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { reports: raw } = await listReports();
        const reportsList = raw || [];

        const reporterIds = reportsList.map((r) => r.reported_by);
        const reporters = await resolveUsers(reporterIds);
        const reporterMap = {};
        reporterIds.forEach((id, i) => { reporterMap[id] = reporters[i]; });

        const posts = {};
        for (const r of reportsList) {
          if (r.target_type === "post" && !posts[r.target_id]) {
            try {
              posts[r.target_id] = await getPost(r.target_id);
            } catch {
              posts[r.target_id] = null;
            }
          }
        }

        const authorIds = [];
        reportsList.forEach((r) => {
          if (r.target_type === "post" && posts[r.target_id]) {
            authorIds.push(posts[r.target_id].user_id);
          } else if (r.target_type === "user") {
            authorIds.push(r.target_id);
          }
        });
        const uniqueAuthorIds = [...new Set(authorIds.map(String))];
        const authors = await resolveUsers(uniqueAuthorIds);
        const authorMap = {};
        uniqueAuthorIds.forEach((id, i) => { authorMap[id] = authors[i]; });

        const mapped = reportsList.map((r) => {
          const reporter = reporterMap[r.reported_by];
          let postAuthor = "—";
          let content = "";
          if (r.target_type === "post") {
            const post = posts[r.target_id];
            if (post) {
              content = post.content;
              postAuthor = authorMap[String(post.user_id)]?.username || "—";
            } else {
              content = t("moderation.deletedContent") || "(contenu indisponible)";
            }
          } else if (r.target_type === "user") {
            postAuthor = authorMap[String(r.target_id)]?.username || "—";
          }
          return { id: r._id, targetId: r.target_id, targetType: r.target_type, reason: r.reason, reporter: reporter?.username || "—", postAuthor, content, status: r.status };
        });
        if (active) setReports(mapped);
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, t('moderation.accessDenied')));
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { users: userList } = await listUsers();
        const mapped = (userList || []).map((u) => ({
          id: u.id,
          username: u.username,
          role: u.role,
          status: u.status,
          ban: u.ban,
        }));
        if (active) setUsers(mapped);
      } catch {
        /* géré par le chargement des signalements */
      }
    })();
    return () => { active = false; };
  }, []);

  const handleResolve = async (id) => {
    const report = reports.find((r) => r.id === id);
    setReports((rs) => rs.filter((r) => r.id !== id));
    try {
      await resolveReport(id);
    } catch (err) {
      console.error('[Moderation] Failed to resolve report:', err);
      if (report) setReports(prev => [...prev, report]);
    }
  };
  const handleIgnoreReport = handleResolve;

  const handleDeletePost = async (report) => {
    setReports((rs) => rs.filter((r) => r.id !== report.id));
    try {
      await deletePost(report.targetId);
    } catch (err) {
      console.error('[Moderation] Failed to delete post:', err);
      setReports(prev => [...prev, report]);
    }
  };

  const handleUpdateUserStatus = async (id, newStatus) => {
    if (newStatus === "active") {
      const previousUser = users.find((u) => u.id === id);
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, status: "active", ban: null } : u)));
      try {
        await unbanUser(id);
      } catch (err) {
        console.error('[Moderation] Failed to unban user:', err);
        if (previousUser) setUsers(prev => prev.map((u) => (u.id === id ? previousUser : u)));
      }
    } else {
      const previousUser = users.find((u) => u.id === id);
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, status: "banned" } : u)));
      try {
        await banUser(id, t('moderation.decision'));
      } catch (err) {
        console.error('[Moderation] Failed to ban user:', err);
        setUsers(prev => prev.map((u) => (u.id === id && previousUser ? previousUser : u)));
      }
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAccountError("");
    setAccountSuccess("");
    try {
      await adminRegister(accountForm);
      setAccountSuccess(t("moderation.accountCreated"));
      setAccountForm({ username: "", email: "", password: "", role: "user" });
    } catch (err) {
      setAccountError(getApiErrorMessage(err, t("moderation.accessDenied")));
    }
  };

  const filteredUsers = userFilter === "all"
    ? users
    : users.filter((user) => user.status === userFilter);

  if (error) {
    return (
      <AppShell>
        <div className="p-8 text-center text-brick-red font-semibold">{error}</div>
      </AppShell>
    );
  }

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
          {isAdmin && (
            <button 
              onClick={() => setActiveTab("accounts")}
              className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "accounts" ? "text-steel-blue" : "text-gray-500 hover:text-deep-space-blue dark:hover:text-papaya-whip"}`}
            >
              {t('moderation.createAccount')}
              {activeTab === "accounts" && <span className="absolute bottom-0 left-0 w-full h-1 bg-steel-blue rounded-t-full"></span>}
            </button>
          )}
        </div>

        {/* CONTENU : SIGNALEMENTS (Fx20) */}
        {activeTab === "reports" && (
          <div className="flex flex-col gap-4">
            {reports.length === 0 ? (
              <p className="text-center py-10 text-gray-500">{t('moderation.noReports')}</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-surface shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-brick-red/10 text-brick-red text-xs font-bold rounded-full">
                      {report.reason}
                    </span>
                    <span className="text-xs text-gray-500">{t('moderation.reportedBy')} @{report.reporter}</span>
                  </div>
                  <p className="text-sm font-medium text-deep-space-blue dark:text-papaya-whip mt-2 mb-1">{t('moderation.author')} @{report.postAuthor}</p>
                  <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-100 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 italic mb-4">
                    "{report.content}"
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleIgnoreReport(report.id)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                      {t('moderation.ignore')}
                    </button>
                    <button onClick={() => handleDeletePost(report)} className="px-4 py-2 text-sm font-bold text-white bg-brick-red hover:bg-red-700 rounded-lg transition-colors shadow-sm">
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
                className="text-sm bg-white dark:bg-surface border border-gray-200 dark:border-steel-blue/40 rounded-lg px-3 py-1.5 outline-none text-deep-space-blue dark:text-papaya-whip cursor-pointer shadow-sm"
              >
                <option value="all">{t('moderation.filterAll')}</option>
                <option value="active">{t('moderation.statusActive')}</option>
                <option value="banned">{t('moderation.statusBanned')}</option>
              </select>
            </div>

            {/* LISTE FILTRÉE */}
            <div className="flex flex-col gap-3">
              {filteredUsers.length === 0 ? (
                <p className="text-center py-10 text-gray-500">{t('moderation.noUsers')}</p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-surface shadow-sm">
                    
                    <div className="flex flex-col">
                      <span className="font-bold text-deep-space-blue dark:text-papaya-whip">@{user.username}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          user.role === "admin" ? "bg-purple-100 text-purple-700" :
                          user.role === "moderator" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        user.status === "active" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {user.status === "active" ? t('moderation.statusActive') : t('moderation.statusBanned')}
                      </span>

                      <select 
                        value={user.status}
                        onChange={(e) => handleUpdateUserStatus(user.id, e.target.value)}
                        className="text-sm bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-steel-blue/40 rounded-lg px-2 py-1.5 outline-none text-deep-space-blue dark:text-papaya-whip cursor-pointer"
                      >
                        <option value="active">{t('moderation.actionActive')}</option>
                        <option value="banned">{t('moderation.actionBan')}</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CONTENU : CRÉATION DE COMPTE (Admin) */}
        {activeTab === "accounts" && isAdmin && (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4 p-4 border border-gray-200 dark:border-steel-blue/40 rounded-xl bg-white dark:bg-surface shadow-sm">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-deep-space-blue dark:text-papaya-whip">{t('moderation.username')}</label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-200 dark:border-steel-blue/40 rounded-lg bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip text-sm outline-none focus:border-steel-blue"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-deep-space-blue dark:text-papaya-whip">{t('moderation.email')}</label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-200 dark:border-steel-blue/40 rounded-lg bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip text-sm outline-none focus:border-steel-blue"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-deep-space-blue dark:text-papaya-whip">{t('moderation.password')}</label>
                <input
                  type="password"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-200 dark:border-steel-blue/40 rounded-lg bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip text-sm outline-none focus:border-steel-blue"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-deep-space-blue dark:text-papaya-whip">{t('moderation.role')}</label>
                <select
                  value={accountForm.role}
                  onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value })}
                  className="px-3 py-2 border border-gray-200 dark:border-steel-blue/40 rounded-lg bg-gray-50 dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip text-sm outline-none focus:border-steel-blue cursor-pointer"
                >
                  <option value="user">{t('moderation.roleUser')}</option>
                  <option value="moderator">{t('moderation.roleModerator')}</option>
                  <option value="admin">{t('moderation.roleAdmin')}</option>
                </select>
              </div>

              {accountError && <p className="text-sm text-brick-red font-semibold">{accountError}</p>}
              {accountSuccess && <p className="text-sm text-green-600 dark:text-green-400 font-semibold">{accountSuccess}</p>}

              <button type="submit" className="self-end px-6 py-2 bg-steel-blue hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                {t('moderation.createAccount')}
              </button>
            </form>
          </div>
        )}

      </div>
    </AppShell>
  );
}