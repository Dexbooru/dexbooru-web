import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
import { buildUrl } from '$lib/shared/helpers/urls';
import type { IComment, ICommentCreateBody } from '$lib/shared/types/comments';
import { toast } from '@zerodevx/svelte-toast';
import { FAILURE_TOAST_OPTIONS } from '../constants/toasts';
import { commentTreeStore } from '../stores/comments';

export const getComments = async (
	postId: string,
	parentCommentId: string | null,
	pageNumber: number
): Promise<Response> => {
	const params = {
		pageNumber,
		parentCommentId: parentCommentId === null ? 'null' : parentCommentId
	};

	const finalUrl = buildUrl(`/api/comments/find/post/${postId}`, params);
	return await fetch(finalUrl);
};

export const createPostCommentsPaginator = (postId: string, parentCommentId: string | null) => {
	let pageNumber = 0;
	let noMoreComments = false;

	return async (isInitialLoad: boolean = false) => {
		if (noMoreComments) {
			return { pageNumber, noMoreComments };
		}

		const response = await getComments(postId, parentCommentId, pageNumber);

		if (response.ok) {
			const comments: IComment[] = convertDataStructureToIncludeDatetimes<IComment>(
				(await response.json()) as IComment[],
				['createdAt']
			);

			commentTreeStore.update((currentCommentTree) => {
				comments.forEach((comment) => {
					currentCommentTree.addComment(comment);
				});

				return currentCommentTree;
			});

			if (comments.length === 0 && !isInitialLoad) {
				toast.push('There are no more comments left to load', FAILURE_TOAST_OPTIONS);
				noMoreComments = true;
			} else {
				pageNumber++;
			}
		} else {
			toast.push(
				'There was an error that occured while loading the comments',
				FAILURE_TOAST_OPTIONS
			);
		}

		return { pageNumber, noMoreComments };
	};
};

export const createComment = async (body: ICommentCreateBody) => {
	return await fetch('/api/comments/create', {
		method: 'POST',
		body: JSON.stringify(body)
	});
};
