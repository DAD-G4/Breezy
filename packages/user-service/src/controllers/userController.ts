import { Response } from 'express';
import { UserModel, ProfileModel, success, error, AuthRequest } from '@breezy/shared';

/**
 * GET /api/users/profile/:id
 * Returns user + profile (display_name, bio, avatar_url), 404 if not found.
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await UserModel.findByPk(id, {
      include: [{ model: ProfileModel, as: 'profile' }],
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      error(res, 'User not found', 404);
      return;
    }

    success(res, user);
  } catch (err) {
    console.error('[GetProfile]', err);
    error(res, 'Internal server error', 500);
  }
}

/**
 * PUT /api/users/profile/:id
 * Updates own profile only (display_name, bio, avatar_url), 403 if not owner.
 * Ownership is checked: req.user.id must match route param :id.
 */
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
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
  } catch (err) {
    console.error('[UpdateProfile]', err);
    error(res, 'Internal server error', 500);
  }
}

/**
 * PUT /api/users/settings/:id
 * Updates language_preference and theme_preference, 403 if not owner.
 * Ownership is checked: req.user.id must match route param :id.
 */
export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
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
  } catch (err) {
    console.error('[UpdateSettings]', err);
    error(res, 'Internal server error', 500);
  }
}
