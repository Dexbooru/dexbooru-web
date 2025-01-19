import {
	handleGetPasswordRecoverySession,
	handlePasswordUpdateAccountRecovery,
} from '$lib/server/controllers/users';
import type { TUser } from '$lib/shared/types/users';
import type { PasswordRecoveryAttempt } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
	default: async (event) => {
		return await handlePasswordUpdateAccountRecovery(event);
	},
};

export const load: PageServerLoad = async (event) => {
	return (await handleGetPasswordRecoverySession(event)) as {
		recoveryAttempt: PasswordRecoveryAttempt & { user: TUser };
	};
};
