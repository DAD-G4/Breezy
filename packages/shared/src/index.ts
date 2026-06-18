// Types
export * from './types';

// Middleware
export { authenticateToken, checkBan } from './middleware/auth';
export type { BanChecker, BanRecord } from './middleware/auth';
export { errorHandler, AppError } from './middleware/errorHandler';
export type { ErrorResponse as ErrorHandlerErrorResponse } from './middleware/errorHandler';
export { default as notFound } from './middleware/notFound';

// Routes
export { default as healthRouter } from './routes/health';

// Utils
export { success, error } from './utils/response';
export type { SuccessResponse, ErrorResponse } from './utils/response';

// PostgreSQL Model Classes (runtime – alias to avoid clash with type interfaces)
export { User as UserModel, UserAttributes, UserCreationAttributes } from './models/postgres/User';
export { Profile as ProfileModel, ProfileAttributes, ProfileCreationAttributes } from './models/postgres/Profile';
export { Follower, Ban } from './models/postgres';
export { sequelize } from './config/connection';

// MongoDB Models
export { default as PostModel } from './models/mongodb/Post';
export type { IPostDocument, IComment, IReply, IPostMedia } from './models/mongodb/Post';
