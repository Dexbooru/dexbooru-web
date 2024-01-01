import CommentTree from '$lib/shared/helpers/comments';
import { writable } from 'svelte/store';

export const commentTreeStore = writable<CommentTree>(new CommentTree());
