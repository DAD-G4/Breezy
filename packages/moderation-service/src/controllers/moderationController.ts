import { Response } from 'express';
import { ReportModel as Report, AuthRequest, Ban, UserModel, UserRole, success, error } from '@breezy/shared';

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

/**
 * Role hierarchy: user < moderator < admin.
 * A moderator can only ban users, not other moderators or admins.
 * An admin can ban anyone.
 */
const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.USER]: 0,
  [UserRole.MODERATOR]: 1,
  [UserRole.ADMIN]: 2,
};

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
