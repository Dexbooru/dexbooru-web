import { handleGetComment } from '$lib/server/controllers/comments';
import type { TComment } from '$lib/shared/types/comments';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleGetComment(event, 'page-server-load')) as {
		comment: { id: string; postId: string; post: { id: string; description: string } };
		thread: TComment[];
	};
};
