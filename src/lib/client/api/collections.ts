import type { TApiResponse } from '$lib/shared/types/api';
import type {
	TCollectionPaginationData,
	TUpdateCollectionBody,
} from '$lib/shared/types/collections';
import { toast } from '@zerodevx/svelte-toast';
import { get } from 'svelte/store';
import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '../constants/toasts';
import { getApiAuthHeaders } from '../helpers/auth';
import { getAuthenticatedUser } from '../helpers/context';

export const editCollection = async (collectionId: string, body: TUpdateCollectionBody) => {
	return await fetch(`/api/collection/${collectionId}`, {
		method: 'PUT',
		body: JSON.stringify(body),
		headers: getApiAuthHeaders(),
	});
};

export const updatePostCollections = async (
	postId: string,
	updatedCollectionMap: Map<string, 'add' | 'delete'>,
) => {
	const body = {
		postId,
		collectionActions: Object.fromEntries(updatedCollectionMap.entries()),
	};

	return await fetch('/api/posts/collections', {
		method: 'PUT',
		body: JSON.stringify(body),
		headers: getApiAuthHeaders(),
	});
};

export const deleteCollection = async (collectionId: string) => {
	return await fetch(`/api/collection/${collectionId}`, {
		method: 'DELETE',
		headers: getApiAuthHeaders(),
	});
};

export const createGetCollectionsByAuthorPaginator = () => {
	const authenticatedUser = get(getAuthenticatedUser());
	const username = authenticatedUser?.username ?? '';
	let pageNumber: number = 0;

	return async () => {
		if (!username) return [];

		const response = await fetch(`/api/user/${username}/collections?pageNumber=${pageNumber}`, {
			method: 'GET',
		});

		if (response.ok) {
			const responseData: TApiResponse<TCollectionPaginationData> = await response.json();
			const collections = responseData.data.collections;
			if (collections.length === 0 && pageNumber > 0) {
				toast.push('There is no more collections to load', SUCCESS_TOAST_OPTIONS);
				return [];
			}
			pageNumber++;

			return collections;
		}

		toast.push('An error occured while fetching the collections', FAILURE_TOAST_OPTIONS);
		return [];
	};
};
