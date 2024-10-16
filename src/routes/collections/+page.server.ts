import { handleCreateCollection } from '$lib/server/controllers/collections';
import type { Action, Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const handlePostCollectionCreation: Action = async (event) => {
	return await handleCreateCollection(event);
};

export const load: PageServerLoad = async () => {
	return {};
};

export const actions = {
	default: handlePostCollectionCreation,
} satisfies Actions;
