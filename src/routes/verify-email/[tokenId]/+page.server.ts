import { handleVerifyEmail } from '$lib/server/controllers/users/emailVerification';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return await handleVerifyEmail(event);
};
