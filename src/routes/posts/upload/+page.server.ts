import { handleCreatePost } from '$lib/server/controllers/posts';
import type { Action, Actions } from './$types';

const defaultHandler: Action = async (event) => {
	return await handleCreatePost(event, 'form-action');
}

export const actions = {
	default: defaultHandler,
} satisfies Actions;
