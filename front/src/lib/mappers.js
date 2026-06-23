// Transformations pures back → front (aucun appel réseau ici).
// La résolution des auteurs (user_id → nom) vit dans services/users.js.

const RELATIVE_TIME_STRINGS = {
  fr: { instant: "à l'instant", day: "j" },
  en: { instant: "just now", day: "d" },
  es: { instant: "ahora mismo", day: "d" },
};

// Temps relatif court à partir d'une date ISO ("à l'instant", "3 min", "2 h", "5 j").
export function relativeTime(dateInput, locale) {
  const date = new Date(dateInput);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  const strings = RELATIVE_TIME_STRINGS[locale] || RELATIVE_TIME_STRINGS.fr;
  if (Number.isNaN(diff)) return "";
  if (diff < 60) return strings.instant;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ${strings.day}`;
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US");
}

// Transforme un post backend (document MongoDB) vers la forme attendue par PostCard.
// authorLabel : nom affiché de l'auteur (résolu via usersService.resolveUser).
// currentUserId : id de l'utilisateur connecté, pour savoir s'il a déjà liké.
export function mapPost(post, { authorLabel, currentUserId, locale } = {}) {
  return {
    id: post._id,
    username: authorLabel || `user${post.user_id}`,
    time: relativeTime(post.created_at, locale),
    content: post.content,
    imageUrl: post.media?.type === "image" ? post.media.url : undefined,
    videoUrl: post.media?.type === "video" ? post.media.url : undefined,
    likesCount: post.likes?.length || 0,
    commentsCount: post.comments?.length || 0,
    isLiked: currentUserId != null && (post.likes?.includes(currentUserId) ?? false),
  };
}
