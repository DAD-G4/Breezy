import { Response } from 'express';
import { Op } from 'sequelize';
import {
  ReportModel as Report,
  AuthRequest,
  Ban,
  UserModel,
  ProfileModel,
  Follower,
  BlockedUser,
  PostModel,
  NotificationModel,
  DirectMessageModel,
  ROLE_HIERARCHY,
  success,
  error,
} from '@breezy/shared';

export async function createReport(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { target_type, target_id, reason } = req.body;

  const report = await Report.create({
    reported_by: req.user!.id,
    target_type,
    target_id,
    reason,
    status: 'pending',
  });

  success(res, report, 'Report created successfully.', 201);
}

export async function listReports(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const status = (req.query.status as 'pending' | 'resolved') || 'pending';
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    Report.find({ status })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments({ status }),
  ]);

  success(res, {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function resolveReport(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: 'resolved' },
    { new: true }
  );

  if (!report) {
    error(res, 'Report not found.', 404);
    return;
  }

  success(res, report, 'Report resolved successfully.');
}

export async function createBan(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { user_id, reason, expires_at } = req.body;

  const targetUser = await UserModel.findByPk(user_id);
  if (!targetUser) {
    error(res, 'Target user not found.', 404);
    return;
  }

  const callerLevel = ROLE_HIERARCHY[req.user!.role] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.role] ?? 0;

  if (callerLevel <= targetLevel) {
    error(res, 'Insufficient permissions to ban this user.', 403);
    return;
  }

  const ban = await Ban.create({
    user_id,
    reason,
    banned_by: req.user!.id,
    expires_at: expires_at || null,
  });

  success(res, ban, 'User banned successfully.', 201);
}

export async function deleteBan(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    error(res, 'Invalid user ID.', 400);
    return;
  }

  const ban = await Ban.findOne({ where: { user_id: userId } });

  if (!ban) {
    error(res, 'No active ban found for this user.', 404);
    return;
  }

  await ban.destroy();

  success(res, null, 'User unbanned successfully.');
}

export async function listBans(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const userId = req.query.user_id
    ? parseInt(req.query.user_id as string, 10)
    : undefined;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (userId !== undefined && !isNaN(userId)) {
    where.user_id = userId;
  }

  const [bans, total] = await Promise.all([
    Ban.findAll({ where, offset, limit, order: [['created_at', 'DESC']] }),
    Ban.count({ where }),
  ]);

  success(res, {
    bans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function listAllUsers(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    UserModel.findAll({
      attributes: ['id', 'username', 'email', 'role', 'is_validated', 'created_at'],
      offset,
      limit,
      order: [['created_at', 'DESC']],
      include: [{
        model: Ban,
        as: 'bans',
        required: false,
        where: {
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } },
          ],
        },
        attributes: ['id', 'reason', 'expires_at', 'created_at'],
      }],
    }),
    UserModel.count(),
  ]);

  const mapped = users.map((u: any) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    is_validated: u.is_validated,
    created_at: u.created_at,
    status: u.bans && u.bans.length > 0 ? 'banned' : 'active',
    ban: u.bans && u.bans.length > 0 ? u.bans[0] : null,
  }));

  success(res, {
    users: mapped,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * DELETE /api/moderation/users/:id  (admin uniquement)
 * Supprime définitivement un utilisateur et tout son contenu.
 * - Postgres (transaction) : follows, blocages, bans, profil, puis l'utilisateur.
 * - Mongo (best-effort) : ses posts, notifications, messages et signalements.
 * Garde-fous : pas d'auto-suppression, pas de suppression d'un rôle >= au sien.
 */
export async function deleteUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    error(res, 'Invalid user ID.', 400);
    return;
  }

  if (userId === req.user!.id) {
    error(res, 'You cannot delete your own account.', 400);
    return;
  }

  const target = await UserModel.findByPk(userId);
  if (!target) {
    error(res, 'User not found.', 404);
    return;
  }

  const callerLevel = ROLE_HIERARCHY[req.user!.role] ?? 0;
  const targetLevel = ROLE_HIERARCHY[target.role] ?? 0;
  if (callerLevel <= targetLevel) {
    error(res, 'Insufficient permissions to delete this user.', 403);
    return;
  }

  // Postgres : suppression atomique des dépendances puis de l'utilisateur
  // (aucune cascade FK n'est définie sur le schéma).
  await UserModel.sequelize!.transaction(async (transaction) => {
    await Follower.destroy({
      where: { [Op.or]: [{ follower_id: userId }, { following_id: userId }] },
      transaction,
    });
    await BlockedUser.destroy({
      where: { [Op.or]: [{ blocker_id: userId }, { blocked_id: userId }] },
      transaction,
    });
    await Ban.destroy({
      where: { [Op.or]: [{ user_id: userId }, { banned_by: userId }] },
      transaction,
    });
    await ProfileModel.destroy({ where: { user_id: userId }, transaction });
    await UserModel.destroy({ where: { id: userId }, transaction });
  });

  // Mongo : nettoyage du contenu (best-effort, hors transaction Postgres).
  await Promise.allSettled([
    PostModel.deleteMany({ user_id: userId }),
    NotificationModel.deleteMany({
      $or: [{ recipient_id: userId }, { sender_id: userId }],
    }),
    DirectMessageModel.deleteMany({
      $or: [{ sender_id: userId }, { recipient_id: userId }],
    }),
    Report.deleteMany({
      $or: [
        { reported_by: userId },
        { target_type: 'user', target_id: String(userId) },
      ],
    }),
  ]);

  success(res, { deleted: true, id: userId }, 'User deleted successfully.');
}
