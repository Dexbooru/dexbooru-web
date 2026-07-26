import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const postId = url.searchParams.get('postId');

	if (!postId) {
		return {};
	}

	return {
		postId,
	};
};
