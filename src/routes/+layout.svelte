<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { validateUserAuthToken } from '$lib/client/api/auth';
	import DeleteCollectionConfirmationModal from '$lib/client/components/collections/card/DeleteCollectionConfirmationModal.svelte';
	import EditCollectionModal from '$lib/client/components/collections/card/EditCollectionModal.svelte';
	import CollectionsPostUpdateModal from '$lib/client/components/collections/CollectionPostUpdateModal.svelte';
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
		getActiveModal,
		updateActiveModal,
		updateAuthenticatedUser,
		updateAuthenticatedUserNotifications,
		updateAuthenticatedUserPreferences,
		updateBlacklistedPostPage,
		updateChangePasswordAuthRequirements,
		updateChangeUsernameAuthRequirements,
		updateCollectionPage,
		updateCollectionPagination,
		updateCommentTree,
		updateFooter,
		updateHiddenCollectionsPage,
		updateHiddenPostsPage,
		updateNsfwCollectionsPage,
		updateNsfwPostPage,
		updateOriginalCollectionPage,
		updateOriginalPostsPage,
		updatePostPagination,
		updatePostsPage,
		updateRegisterFormAuthRequirements,
		updateUserCollections,
	} from '$lib/client/helpers/context';
	import {
		destroyDocumentEventListeners,
		registerDocumentEventListeners,
	} from '$lib/client/helpers/dom';
	import { NULLABLE_USER, NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
	import { SESSION_ID_KEY } from '$lib/shared/constants/session';
	import CommentTree from '$lib/shared/helpers/comments';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onMount } from 'svelte';
	import '../app.postcss';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

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
	updateCollectionPage([]);
	updateOriginalCollectionPage([]);
	updateNsfwCollectionsPage([]);
	updateCollectionPagination(null);
	updateHiddenCollectionsPage({
		nsfwCollections: [],
	});
	updateUserCollections([]);

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
		const validateTokenIntervalId = setInterval(validateUserSession, AUTH_CHECK_INTERVAL_SIZE);

		registerDocumentEventListeners(data.user, data.userPreferences, getActiveModal());

		return () => {
			destroyDocumentEventListeners(data.user, data.userPreferences, getActiveModal());
			clearInterval(validateTokenIntervalId);
		};
	});
</script>

<svelte:head>
	<meta property="og:site_name" content="Dexbooru" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.href} />
	<meta property="og:locale" content="en_US" />
</svelte:head>

<Navbar />
<div class="flex-grow">
	{@render children?.()}
</div>
<Footer />
<SvelteToast options={TOAST_DEFAULT_OPTIONS} />
<GlobalSearchModal />
<HiddenPostModal />
<PostCardReportModal />
<EditPostModal />
<DeletePostConfirmationModal />
<ImagePreviewModal />
<CollectionsPostUpdateModal />
<EditCollectionModal />
<DeleteCollectionConfirmationModal />
