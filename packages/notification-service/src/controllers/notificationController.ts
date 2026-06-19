import { Response } from 'express';
import { NotificationModel as Notification, success, error, AuthRequest } from '@breezy/shared';

/**
 * GET /api/notifications
 * Get current user's notifications, paginated, reverse chronological.
 * Query params: ?page=1&limit=20
 */
export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ recipient_id: req.user.id })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ recipient_id: req.user.id });

  success(res, {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read. Only the recipient can mark their own notifications.
 */
export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, 'Authentication required', 401);
    return;
  }

  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    error(res, 'Notification not found', 404);
    return;
  }

  if (notification.recipient_id !== req.user.id) {
    error(res, 'Forbidden: you can only mark your own notifications as read', 403);
    return;
  }

  notification.is_read = true;
  await notification.save();

  success(res, notification, 'Notification marked as read');
}
