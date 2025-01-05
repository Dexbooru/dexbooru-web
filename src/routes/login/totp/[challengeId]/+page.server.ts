import { handleGetUserTotp, handleProcessUserTotp } from '$lib/server/controllers/users';
import type { TTotpChallenge } from '$lib/shared/types/totp';
import type { Action, Actions, PageServerLoad } from './$types';

const handleSubmitOtp: Action = async (event) => {
	return await handleProcessUserTotp(event);
};

export const load: PageServerLoad = async (event) => {
	return (await handleGetUserTotp(event)) as { challengeData: TTotpChallenge };
};

export const actions = {
	default: handleSubmitOtp,
} satisfies Actions;
