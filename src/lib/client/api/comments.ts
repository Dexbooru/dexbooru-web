import { buildUrl } from '$lib/client/helpers/urls';
import type CommentTree from '$lib/shared/helpers/comments';
import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
import type { TApiResponse } from '$lib/shared/types/api';
import type { TComment, TCommentCreateBody } from '$lib/shared/types/comments';
import { toast } from '@zerodevx/svelte-toast';
import type { Writable } from 'svelte/store';
import { FAILURE_TOAST_OPTIONS } from '../constants/toasts';

export const getComments = async (
	postId: string,
	parentCommentId: string | null,
	pageNumber: number,
): Promise<Response> => {
	const params = {
		pageNumber,
		parentCommentId: parentCommentId === null ? 'null' : parentCommentId,
	};

	const finalUrl = buildUrl(`/api/post/${postId}/comments`, params);
	return await fetch(finalUrl);
};

export const createPostCommentsPaginator = (
	postId: string,
	parentCommentId: string | null,
	commentTree: Writable<CommentTree>,
) => {
	let pageNumber = 0;
	let noMoreComments = false;

	return async () => {
		if (noMoreComments) {
			return { pageNumber, noMoreComments };
		}

		const response = await getComments(postId, parentCommentId, pageNumber);

		if (response.ok) {
			const responseData: TApiResponse<TComment[]> = await response.json();
			const comments = convertDataStructureToIncludeDatetimes(responseData.data) as TComment[];

			commentTree.update((currentCommentTree) => {
				comments.forEach((comment) => {
					currentCommentTree.addComment(comment);
				});

				return currentCommentTree;
			});

			if (comments.length === 0) {
				toast.push('There are no more comments left to load', FAILURE_TOAST_OPTIONS);
				noMoreComments = true;
			} else {
				pageNumber++;
			}
		} else {
			toast.push(
				'There was an error that occured while loading the comments',
				FAILURE_TOAST_OPTIONS,
			);
		}

		return { pageNumber, noMoreComments };
	};
};

export const createComment = async (postId: string, body: TCommentCreateBody) => {
	return await fetch(`/api/post/${postId}/comments`, {
		method: 'POST',
		body: JSON.stringify(body),
	});
};
