export * from './types';

export { authenticateToken, checkBan, requireRole, getJwtSecret, createBanChecker, ROLE_HIERARCHY } from './middleware/auth';
export type { BanChecker, BanRecord } from './middleware/auth';
export { errorHandler, AppError } from './middleware/errorHandler';
export type { ErrorResponse as ErrorHandlerErrorResponse } from './middleware/errorHandler';
export { default as notFound } from './middleware/notFound';
export { asyncHandler } from './middleware/asyncHandler';
export {
  validateRequired,
  validatePostContent,
  validateCommentContent,
  validateDMContent,
  validateLoginInput,
  validateReportInput,
  validateBanInput,
  validateContent,
  validateEmail,
  validateUsername,
  validatePassword,
  validateRegisterInput,
} from './middleware/validate';
export type { RegisterInput } from './middleware/validate';

export { default as healthRouter } from './routes/health';

export { connectPostgres, connectMongo } from './config/database';

export { success, error } from './utils/response';
export type { SuccessResponse, ErrorResponse } from './utils/response';

// alias to avoid name clash with type interfaces
export { User as UserModel, UserAttributes, UserCreationAttributes } from './models/postgres/User';
export { Profile as ProfileModel, ProfileAttributes, ProfileCreationAttributes } from './models/postgres/Profile';
export { Follower, Ban, BlockedUser } from './models/postgres';
export { sequelize } from './config/connection';

export { default as PostModel } from './models/mongodb/Post';
export type { IPostDocument, IComment, IReply, IPostMedia } from './models/mongodb/Post';

export { default as NotificationModel } from './models/mongodb/Notification';
export type { INotificationDocument } from './models/mongodb/Notification';

export { default as DirectMessageModel } from './models/mongodb/DirectMessage';
export type { IDirectMessageDocument } from './models/mongodb/DirectMessage';

export { default as ReportModel } from './models/mongodb/Report';
export type { IReportDocument } from './models/mongodb/Report';
