import type { getUserStatistics } from '$lib/server/db/actions/user';
import type { LinkedUserAccount, User } from '@prisma/client';

export type TUser = User & {
	linkedAccounts: LinkedUserAccount[];
};
export type TUserStatistics = Awaited<ReturnType<typeof getUserStatistics>>;
