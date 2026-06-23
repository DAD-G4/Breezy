import { Response, Request } from 'express';
import { UserModel, ProfileModel, Follower, PostModel, success, error, AuthRequest } from '@breezy/shared';

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

  success(res, { ...user.toJSON(), followers_count: followersCount, following_count: followingCount, post_count: postsCount });
}

/**
 * GET /api/users/username/:username
 * Returns user + profile by username, 404 if not found. Public route — no auth required.
 */
export async function getProfileByUsername(req: Request, res: Response): Promise<void> {
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

  success(res, { ...user.toJSON(), followers_count: followersCount, following_count: followingCount, post_count: postsCount });
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

  const profile = await ProfileModel.findOne({ where: { user_id: id } });

  if (!profile) {
    error(res, 'Profile not found', 404);
    return;
  }

  const updatedFields: Record<string, any> = {};
  if (display_name !== undefined) updatedFields.display_name = display_name;
  if (bio !== undefined) updatedFields.bio = bio;
  if (avatar_url !== undefined) updatedFields.avatar_url = avatar_url;

  await profile.update(updatedFields);

  success(res, profile, 'Profile updated successfully');
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
