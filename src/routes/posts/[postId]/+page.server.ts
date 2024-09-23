import { handleGetPost } from '$lib/server/controllers/posts';
import type { TPost } from '$lib/shared/types/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return await handleGetPost(event, 'page-server-load') as { post: TPost, uploadedSuccessfully: boolean };
};
