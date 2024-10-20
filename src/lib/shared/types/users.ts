import type { getUserStatistics } from '$lib/server/db/actions/user';
import type { User } from '@prisma/client';

export type TUser = User;
export type TUserStatistics = Awaited<ReturnType<typeof getUserStatistics>>;
