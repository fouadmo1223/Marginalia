import type { UserDocument } from '../models/User';
import { ApiError } from './api-response';

/** Every admin API route must call this — page-level middleware alone is not sufficient authorization. */
export function requireAdmin(user: UserDocument | null): asserts user is UserDocument {
  if (!user) throw new ApiError('Authentication required', 401);
  if (user.role !== 'admin') throw new ApiError('Admin access required', 403);
}
