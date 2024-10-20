import type CommentTree from '$lib/shared/helpers/comments';
import type { TUserNotifications } from '$lib/shared/types/notifcations';
import type { THiddenPagePostData, TPost, TPostPaginationData } from '$lib/shared/types/posts';
import type { TUser } from '$lib/shared/types/users';
import type { UserPreference } from '@prisma/client';
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import {
	ACTIVE_MODAL_CONTEXT_KEY,
	BLACKLISTED_POST_PAGE_CONTEXT_KEY,
	CHANGE_PASSWORD_AUTH_REQUIREMENTS_CONTEXT_KEY,
	CHANGE_USERNAME_AUTH_REQUIREMENTS_CONTEXT_KEY,
	COMMENT_TREE_CONTEXT_KEY,
	FOOTER_CONTEXT_KEY,
	HIDDEN_POSTS_PAGE_CONTEXT_KEY,
	NSFW_POST_PAGE_CONTEXT_KEY,
	ORIGINAL_POSTS_PAGE_CONTEXT_KEY,
	POSTS_PAGE_CONTEXT_KEY,
	POST_PAGINATION_CONTEXT_KEY,
	REGISTER_FORM_AUTH_REQUIREMENTS_CONTEXT_KEY,
	USER_CONTEXT_KEY,
	USER_NOTIFICATIONS_CONTEXT_KEY,
	USER_PREFERENCE_CONTEXT_KEY,
} from '../constants/context';
import type { TAuthFormRequirementData, TFooterStoreData, TModalStoreData } from '../types/stores';

export const updateChangePasswordAuthRequirements = (requirements: TAuthFormRequirementData) => {
	const updatedRequirements = writable(requirements);
	setContext(CHANGE_PASSWORD_AUTH_REQUIREMENTS_CONTEXT_KEY, updatedRequirements);
};

export const updateChangeUsernameAuthRequirements = (requirements: TAuthFormRequirementData) => {
	const updatedRequirements = writable(requirements);
	setContext(CHANGE_USERNAME_AUTH_REQUIREMENTS_CONTEXT_KEY, updatedRequirements);
};

export const updateRegisterFormAuthRequirements = (requirements: TAuthFormRequirementData) => {
	const updatedRequirements = writable(requirements);
	setContext(REGISTER_FORM_AUTH_REQUIREMENTS_CONTEXT_KEY, updatedRequirements);
};

export const updateFooter = (footerData: TFooterStoreData) => {
	const updatedFooter = writable(footerData);
	setContext(FOOTER_CONTEXT_KEY, updatedFooter);
};

export const updateCommentTree = (commentTree: CommentTree) => {
	const updatedCommentTree = writable(commentTree);
	setContext(COMMENT_TREE_CONTEXT_KEY, updatedCommentTree);
};

export const updateActiveModal = (activeModal: TModalStoreData) => {
	const updatedActiveModal = writable(activeModal);
	setContext(ACTIVE_MODAL_CONTEXT_KEY, updatedActiveModal);
};

export const updatePostPagination = (paginationData: TPostPaginationData | null) => {
	const updatedPaginationData = writable(paginationData);
	setContext(POST_PAGINATION_CONTEXT_KEY, updatedPaginationData);
};

export const updatePostsPage = (posts: TPost[]) => {
	const updatedPosts = writable(posts);
	setContext(POSTS_PAGE_CONTEXT_KEY, updatedPosts);
};

export const updateOriginalPostsPage = (originalPosts: TPost[]) => {
	const updatedOriginalPosts = writable(originalPosts);
	setContext(ORIGINAL_POSTS_PAGE_CONTEXT_KEY, updatedOriginalPosts);
};

export const updateBlacklistedPostPage = (blacklistedPosts: TPost[]) => {
	const updatedBlacklistedPosts = writable(blacklistedPosts);
	setContext(BLACKLISTED_POST_PAGE_CONTEXT_KEY, updatedBlacklistedPosts);
};

export const updateNsfwPostPage = (nsfwPosts: TPost[]) => {
	const updatedNsfwPosts = writable(nsfwPosts);
	setContext(NSFW_POST_PAGE_CONTEXT_KEY, updatedNsfwPosts);
};

export const updateHiddenPostsPage = (hiddenPagePosts: THiddenPagePostData) => {
	const updatedHiddenPosts = writable(hiddenPagePosts);
	setContext(HIDDEN_POSTS_PAGE_CONTEXT_KEY, updatedHiddenPosts);
};

export const updateAuthenticatedUser = (user: TUser | null) => {
	const updatedUser = writable(user);
	setContext(USER_CONTEXT_KEY, updatedUser);
};

export const updateAuthenticatedUserNotifications = (notifications: TUserNotifications | null) => {
	const updatedNotifications = writable(notifications);
	setContext(USER_NOTIFICATIONS_CONTEXT_KEY, updatedNotifications);
};

export const updateAuthenticatedUserPreferences = (userPreferences: UserPreference) => {
	const updatedUserPreferences = writable(userPreferences);
	setContext(USER_PREFERENCE_CONTEXT_KEY, updatedUserPreferences);
};

export const getChangePasswordAuthRequirements = (): Writable<TAuthFormRequirementData> => {
	return getContext<Writable<TAuthFormRequirementData>>(
		CHANGE_PASSWORD_AUTH_REQUIREMENTS_CONTEXT_KEY,
	);
};

export const getChangeUsernameAuthRequirements = (): Writable<TAuthFormRequirementData> => {
	return getContext<Writable<TAuthFormRequirementData>>(
		CHANGE_USERNAME_AUTH_REQUIREMENTS_CONTEXT_KEY,
	);
};

export const getRegisterFormAuthRequirements = (): Writable<TAuthFormRequirementData> => {
	return getContext<Writable<TAuthFormRequirementData>>(
		REGISTER_FORM_AUTH_REQUIREMENTS_CONTEXT_KEY,
	);
};

export const getAuthenticatedUser = () => {
	return getContext<Writable<TUser | null>>(USER_CONTEXT_KEY);
};

export const getAuthenticatedUserPreferences = () => {
	return getContext<Writable<UserPreference>>(USER_PREFERENCE_CONTEXT_KEY);
};

export const getAuthenticatedUserNotifications = () => {
	return getContext<Writable<TUserNotifications | null>>(USER_NOTIFICATIONS_CONTEXT_KEY);
};

export const getPostPaginationData = () => {
	return getContext<Writable<TPostPaginationData | null>>(POST_PAGINATION_CONTEXT_KEY);
};

export const getPostsPage = () => {
	return getContext<Writable<TPost[]>>(POSTS_PAGE_CONTEXT_KEY);
};

export const getOriginalPostsPage = () => {
	return getContext<Writable<TPost[]>>(ORIGINAL_POSTS_PAGE_CONTEXT_KEY);
};

export const getBlacklistedPostPage = () => {
	return getContext<Writable<TPost[]>>(BLACKLISTED_POST_PAGE_CONTEXT_KEY);
};

export const getNsfwPostPage = () => {
	return getContext<Writable<TPost[]>>(NSFW_POST_PAGE_CONTEXT_KEY);
};

export const getHiddenPostsPage = () => {
	return getContext<Writable<THiddenPagePostData>>(HIDDEN_POSTS_PAGE_CONTEXT_KEY);
};

export const getActiveModal = () => {
	return getContext<Writable<TModalStoreData>>(ACTIVE_MODAL_CONTEXT_KEY);
};

export const getCommentTree = () => {
	return getContext<Writable<CommentTree>>(COMMENT_TREE_CONTEXT_KEY);
};

export const getFooter = () => {
	return getContext<Writable<TFooterStoreData>>(FOOTER_CONTEXT_KEY);
};
