import { Response } from 'express';
import { Op } from 'sequelize';
import { UserModel, ProfileModel, Follower, BlockedUser, PostModel, success, error, AuthRequest } from '@breezy/shared';

/**
 * GET /api/users/profile/:id
 * Returns user + profile (display_name, bio, avatar_url), 404 if not found.
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const user = await UserModel.findByPk(id, {
    include: [{ model: ProfileModel, as: 'profile' }],
    attributes: { exclude: ['password_hash'] },
  });

  if (!user) {
    error(res, 'User not found', 404);
    return;
  }

  const userId = parseInt(id, 10);

  const [followersCount, followingCount, postsCount] = await Promise.all([
    Follower.count({ where: { following_id: userId } }),
    Follower.count({ where: { follower_id: userId } }),
    PostModel.countDocuments({ user_id: userId }),
  ]);

  const isFollowing = await viewerFollows(req.user?.id, userId);
  const isBlocked = await blockedBetween(req.user?.id, userId);

  success(res, { ...user.toJSON(), followers_count: followersCount, following_count: followingCount, post_count: postsCount, is_following: isFollowing, is_blocked: isBlocked });
}

/**
 * PUT /api/users/ping
 * Met à jour last_active de l'utilisateur courant (présence en ligne).
 */
export async function ping(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }
  await ProfileModel.update({ last_active: new Date() }, { where: { user_id: req.user.id } });
  success(res, null, 'ok');
}

/** True si le viewer (connecté) suit l'utilisateur cible. */
async function viewerFollows(viewerId: number | undefined, targetId: number): Promise<boolean> {
  if (!viewerId || viewerId === targetId) return false;
  const count = await Follower.count({ where: { follower_id: viewerId, following_id: targetId } });
  return count > 0;
}

/** True si un blocage existe entre le viewer et la cible (dans un sens ou l'autre). */
async function blockedBetween(viewerId: number | undefined, targetId: number): Promise<boolean> {
  if (!viewerId || viewerId === targetId) return false;
  const count = await BlockedUser.count({
    where: {
      [Op.or]: [
        { blocker_id: viewerId, blocked_id: targetId },
        { blocker_id: targetId, blocked_id: viewerId },
      ],
    },
  });
  return count > 0;
}

/**
 * GET /api/users/username/:username
 * Returns user + profile by username, 404 if not found. Public route
 * (optionalAuth) — renvoie is_following si le viewer est connecté.
 */
export async function getProfileByUsername(req: AuthRequest, res: Response): Promise<void> {
  const { username } = req.params;

  const user = await UserModel.findOne({
    where: { username },
    include: [{ model: ProfileModel, as: 'profile' }],
    attributes: { exclude: ['password_hash'] },
  });

  if (!user) {
    error(res, 'User not found', 404);
    return;
  }

  const userId = user.get('id') as number;

  const [followersCount, followingCount, postsCount] = await Promise.all([
    Follower.count({ where: { following_id: userId } }),
    Follower.count({ where: { follower_id: userId } }),
    PostModel.countDocuments({ user_id: userId }),
  ]);

  const isFollowing = await viewerFollows(req.user?.id, userId);
  const isBlocked = await blockedBetween(req.user?.id, userId);

  success(res, { ...user.toJSON(), followers_count: followersCount, following_count: followingCount, post_count: postsCount, is_following: isFollowing, is_blocked: isBlocked });
}

/**
 * GET /api/users/search?q=query
 * Searches users by username or display_name (case-insensitive).
 * Returns up to 20 matching users with profile info.
 */
export async function searchUsers(req: AuthRequest, res: Response): Promise<void> {
  const q = (req.query.q as string || '').trim();

  if (!q) {
    success(res, { users: [] });
    return;
  }

  const pattern = `%${q}%`;

  const users = await UserModel.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.iLike]: pattern } },
      ],
    },
    include: [{ model: ProfileModel, as: 'profile' }],
    attributes: { exclude: ['password_hash'] },
    limit: 20,
  });

  const profileMatches = await ProfileModel.findAll({
    where: { display_name: { [Op.iLike]: pattern } },
    include: [{
      model: UserModel,
      as: 'user',
      attributes: { exclude: ['password_hash'] },
    }],
    limit: 20,
  });

  const seenIds = new Set(users.map((u: any) => u.get('id')));
  const merged = [...users];

  for (const p of profileMatches) {
    const u = (p as any).get('user');
    if (u && !seenIds.has(u.get('id'))) {
      seenIds.add(u.get('id'));
      u.dataValues.profile = p.toJSON();
      merged.push(u);
    }
  }

  // Masque les utilisateurs bloqués (dans un sens ou l'autre) : ils ne doivent
  // apparaître ni dans la recherche, ni dans le compositeur « + Message ».
  const me = req.user?.id;
  let blockedIds = new Set<number>();
  if (me) {
    const blocks = await BlockedUser.findAll({
      where: { [Op.or]: [{ blocker_id: me }, { blocked_id: me }] },
      attributes: ['blocker_id', 'blocked_id'],
    });
    blockedIds = new Set(
      blocks.map((b: any) =>
        b.get('blocker_id') === me ? b.get('blocked_id') : b.get('blocker_id')
      )
    );
  }
  const visible = merged.filter((u: any) => !blockedIds.has(u.get('id')));

  const results = visible.slice(0, 20).map((u: any) => {
    const profile = u.get('profile');
    return {
      id: u.get('id'),
      username: u.get('username'),
      display_name: profile?.display_name || u.get('username'),
      avatar_url: profile?.avatar_url || null,
      bio: profile?.bio || '',
    };
  });

  success(res, { users: results });
}

/**
 * GET /api/users/suggestions
 * Returns up to 5 users the current user can follow:
 * excludes self, already-followed users and blocked users.
 */
export async function getSuggestions(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }
  const me = req.user.id;

  const [following, blocked] = await Promise.all([
    Follower.findAll({ where: { follower_id: me }, attributes: ['following_id'] }),
    BlockedUser.findAll({ where: { blocker_id: me }, attributes: ['blocked_id'] }),
  ]);

  const excludeIds = [
    me,
    ...following.map((f: any) => f.get('following_id')),
    ...blocked.map((b: any) => b.get('blocked_id')),
  ];

  const users = await UserModel.findAll({
    where: { id: { [Op.notIn]: excludeIds } },
    include: [{ model: ProfileModel, as: 'profile' }],
    attributes: { exclude: ['password_hash'] },
    order: [['created_at', 'DESC']],
    limit: 5,
  });

  const results = users.map((u: any) => {
    const profile = u.get('profile');
    return {
      id: u.get('id'),
      username: u.get('username'),
      display_name: profile?.display_name || u.get('username'),
      avatar_url: profile?.avatar_url || null,
    };
  });

  success(res, { users: results });
}

/**
 * PUT /api/users/profile/:id
 * Updates own profile only (display_name, bio, avatar_url), 403 if not owner.
 * Ownership is checked: req.user.id must match route param :id.
 */
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;

  if (req.user.id !== parseInt(id, 10)) {
    error(res, 'Forbidden: you can only update your own profile', 403);
    return;
  }

  const { display_name, bio, avatar_url } = req.body;

  let normalizedBio = bio;
  if (bio !== undefined && bio !== null) {
    if (bio.length > 160) {
      error(res, 'Bio must be 160 characters or less', 400);
      return;
    }
    normalizedBio = bio.replace(/\n{3,}/g, '\n\n');
    if (normalizedBio.split('\n').length > 5) {
      error(res, 'Bio cannot exceed 5 lines', 400);
      return;
    }
  }
  if (display_name !== undefined && display_name !== null && display_name.length > 50) {
    error(res, 'Display name must be 50 characters or less', 400);
    return;
  }

  const profile = await ProfileModel.findOne({ where: { user_id: id } });

  if (!profile) {
    error(res, 'Profile not found', 404);
    return;
  }

  const updatedFields: Record<string, any> = {};
  if (display_name !== undefined) updatedFields.display_name = display_name;
  if (bio !== undefined) updatedFields.bio = normalizedBio;
  if (avatar_url !== undefined) updatedFields.avatar_url = avatar_url;

  await profile.update(updatedFields);

  success(res, profile, 'Profile updated successfully');
}

/**
 * POST /api/users/batch
 * Returns profiles for multiple users in one request. Accepts { ids: number[] } body.
 * Max 100 IDs per request. Uses WHERE IN query for efficiency.
 */
export async function getBatchProfiles(req: AuthRequest, res: Response): Promise<void> {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    error(res, 'ids array is required', 400);
    return;
  }

  if (ids.length > 100) {
    error(res, 'Too many IDs (max 100)', 400);
    return;
  }

  const users = await UserModel.findAll({
    where: { id: ids },
    include: [{ model: ProfileModel, as: 'profile' }],
    attributes: { exclude: ['password_hash'] },
  });

  const usersWithCounts = await Promise.all(
    users.map(async (user) => {
      const profile = user.get('profile') as { display_name?: string; bio?: string; avatar_url?: string } | null;
      const userId = user.get('id') as number;

      const [followerCount, followingCount, postCount] = await Promise.all([
        Follower.count({ where: { following_id: userId } }),
        Follower.count({ where: { follower_id: userId } }),
        PostModel.countDocuments({ user_id: userId }),
      ]);

      return {
        id: userId,
        username: user.get('username'),
        email: user.get('email'),
        display_name: profile?.display_name || user.get('username'),
        bio: profile?.bio || '',
        avatar_url: profile?.avatar_url || '',
        follower_count: followerCount,
        following_count: followingCount,
        post_count: postCount,
      };
    })
  );

  success(res, { users: usersWithCounts });
}

/**
 * PUT /api/users/settings/:id
 * Updates language_preference and theme_preference, 403 if not owner.
 * Ownership is checked: req.user.id must match route param :id.
 */
export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;

  if (req.user.id !== parseInt(id, 10)) {
    error(res, 'Forbidden: you can only update your own settings', 403);
    return;
  }

  const { language_preference, theme_preference } = req.body;

  const profile = await ProfileModel.findOne({ where: { user_id: id } });

  if (!profile) {
    error(res, 'Profile not found', 404);
    return;
  }

  const updatedFields: Record<string, any> = {};
  if (language_preference !== undefined) updatedFields.language_preference = language_preference;
  if (theme_preference !== undefined) updatedFields.theme_preference = theme_preference;

  await profile.update(updatedFields);

  success(res, profile, 'Settings updated successfully');
}

/**
 * GET /api/users/followers/:id
 * Returns the list of users who follow the given user.
 */
export async function getFollowers(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = parseInt(id, 10);

  const user = await UserModel.findByPk(userId, { attributes: ['id'] });
  if (!user) {
    error(res, 'User not found', 404);
    return;
  }

  const follows = await Follower.findAll({
    where: { following_id: userId },
    include: [
      {
        model: UserModel,
        as: 'follower',
        attributes: { exclude: ['password_hash'] },
        include: [{ model: ProfileModel, as: 'profile' }],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  const followers = await Promise.all(
    follows.map(async (f: any) => {
      const u = f.get('follower');
      if (!u) return null;
      const uid = u.get('id') as number;
      const [followerCount, followingCount] = await Promise.all([
        Follower.count({ where: { following_id: uid } }),
        Follower.count({ where: { follower_id: uid } }),
      ]);
      return {
        id: uid,
        username: u.get('username'),
        display_name: u.get('profile')?.display_name || u.get('username'),
        avatar_url: u.get('profile')?.avatar_url || null,
        follower_count: followerCount,
        following_count: followingCount,
      };
    })
  );

  success(res, { users: followers.filter(Boolean) });
}

/**
 * GET /api/users/following/:id
 * Returns the list of users that the given user follows.
 */
export async function getFollowing(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = parseInt(id, 10);

  const user = await UserModel.findByPk(userId, { attributes: ['id'] });
  if (!user) {
    error(res, 'User not found', 404);
    return;
  }

  const follows = await Follower.findAll({
    where: { follower_id: userId },
    include: [
      {
        model: UserModel,
        as: 'following',
        attributes: { exclude: ['password_hash'] },
        include: [{ model: ProfileModel, as: 'profile' }],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  const followingList = await Promise.all(
    follows.map(async (f: any) => {
      const u = f.get('following');
      if (!u) return null;
      const uid = u.get('id') as number;
      const [followerCount, followingCount] = await Promise.all([
        Follower.count({ where: { following_id: uid } }),
        Follower.count({ where: { follower_id: uid } }),
      ]);
      return {
        id: uid,
        username: u.get('username'),
        display_name: u.get('profile')?.display_name || u.get('username'),
        avatar_url: u.get('profile')?.avatar_url || null,
        follower_count: followerCount,
        following_count: followingCount,
      };
    })
  );

  success(res, { users: followingList.filter(Boolean) });
}
