import type { LinkedUserAccount, User, UserModerationStatus } from '$generated/prisma/client';
import type { getUserStatistics } from '$lib/server/db/actions/user';

export type TUser = User & {
	linkedAccounts: LinkedUserAccount[];
	moderationStatus: UserModerationStatus;
};
export type TUserStatistics = Awaited<ReturnType<typeof getUserStatistics>>;
