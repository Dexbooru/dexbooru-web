import type { LinkedUserAccount, User } from '$generated/prisma/client';
import type { getUserStatistics } from '$lib/server/db/actions/user';

export type TUser = User & {
	linkedAccounts: LinkedUserAccount[];
};
export type TUserStatistics = Awaited<ReturnType<typeof getUserStatistics>>;
