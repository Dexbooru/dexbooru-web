<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { validateUserAuthToken } from '$lib/client/api/auth';
	import CollectionsModal from '$lib/client/components/collections/CollectionsModal.svelte';
	import ImagePreviewModal from '$lib/client/components/images/ImagePreviewModal.svelte';
	import Footer from '$lib/client/components/layout/Footer.svelte';
	import Navbar from '$lib/client/components/layout/Navbar.svelte';
	import DeletePostConfirmationModal from '$lib/client/components/posts/card/DeletePostConfirmationModal.svelte';
	import EditPostModal from '$lib/client/components/posts/card/EditPostModal.svelte';
	import PostCardReportModal from '$lib/client/components/posts/card/PostCardReportModal.svelte';
	import HiddenPostModal from '$lib/client/components/posts/container/HiddenPostModal.svelte';
	import GlobalSearchModal from '$lib/client/components/search/GlobalSearchModal.svelte';
	import { TOAST_DEFAULT_OPTIONS } from '$lib/client/constants/toasts';
	import {
		updateActiveModal,
		updateAuthenticatedUser,
		updateAuthenticatedUserNotifications,
		updateAuthenticatedUserPreferences,
		updateBlacklistedPostPage,
		updateChangePasswordAuthRequirements,
		updateChangeUsernameAuthRequirements,
		updateCommentTree,
		updateFooter,
		updateHiddenPostsPage,
		updateNsfwPostPage,
		updateOriginalPostsPage,
		updatePostPagination,
		updatePostsPage,
		updateRegisterFormAuthRequirements,
	} from '$lib/client/helpers/context';
	import {
		destroyDocumentEventListeners,
		registerDocumentEventListeners,
	} from '$lib/client/helpers/dom';
	import { NULLABLE_USER, NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
	import { SESSION_ID_KEY } from '$lib/shared/constants/session';
	import CommentTree from '$lib/shared/helpers/comments';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onDestroy, onMount } from 'svelte';
	import '../app.postcss';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	updateAuthenticatedUserNotifications(
		data.user.id === NULLABLE_USER.id ? null : data.userNotifications,
	);
	updateAuthenticatedUser(data.user.id === NULLABLE_USER.id ? null : data.user);
	updateAuthenticatedUserPreferences(
		data.user.id === NULLABLE_USER.id ? NULLABLE_USER_USER_PREFERENCES : data.userPreferences,
	);
	updatePostPagination(null);
	updatePostsPage([]);
	updateOriginalPostsPage([]);
	updateBlacklistedPostPage([]);
	updateNsfwPostPage([]);
	updateHiddenPostsPage({
		nsfwPosts: [],
		blacklistedPosts: [],
	});
	updateCommentTree(new CommentTree());
	updateActiveModal({
		isOpen: false,
		focusedModalName: null,
	});
	updateFooter({
		height: 0,
		bottom: 0,
		element: null,
	});
	updateChangePasswordAuthRequirements({});
	updateRegisterFormAuthRequirements({});
	updateChangeUsernameAuthRequirements({});

	let validateTokenIntervalId: NodeJS.Timeout;
	const AUTH_CHECK_INTERVAL_SIZE = 60 * 2.5 * 1000;

	const validateUserSession = async () => {
		if (data.user.id === NULLABLE_USER.id) {
			localStorage.removeItem(SESSION_ID_KEY);
			return;
		}

		if (localStorage.getItem(SESSION_ID_KEY)) {
			const response = await validateUserAuthToken();
			if (response.status === 401) {
				localStorage.removeItem(SESSION_ID_KEY);
				goto('/profile/logout');
			}
		} else {
			goto('/profile/logout');
		}
	};

	onMount(() => {
		validateUserSession();
		validateTokenIntervalId = setInterval(validateUserSession, AUTH_CHECK_INTERVAL_SIZE);

		registerDocumentEventListeners(data.user, data.userPreferences);

		return () => {
			destroyDocumentEventListeners(data.user, data.userPreferences);
		};
	});

	onDestroy(() => {
		clearInterval(validateTokenIntervalId);
	});
</script>

<svelte:head>
	<meta property="og:site_name" content="Dexbooru" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.href} />
	<meta property="og:locale" content="en_US" />
</svelte:head>

<Navbar />
<div style="flex:1">
	<slot />
</div>
<Footer />
<SvelteToast options={TOAST_DEFAULT_OPTIONS} />
<GlobalSearchModal />
<HiddenPostModal />
<PostCardReportModal />
<EditPostModal />
<DeletePostConfirmationModal />
<ImagePreviewModal />
<CollectionsModal />
