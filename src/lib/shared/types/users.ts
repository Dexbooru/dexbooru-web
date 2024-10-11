import type { getUserStatistics } from '$lib/server/db/actions/user';
import type { User } from '@prisma/client';

export type IUser = User;
export type TUserStatistics = Awaited<ReturnType<typeof getUserStatistics>>;
