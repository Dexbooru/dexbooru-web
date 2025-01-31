<script lang="ts">
	import { page } from '$app/state';
	import DeleteCollectionConfirmationModal from '$lib/client/components/collections/card/DeleteCollectionConfirmationModal.svelte';
	import EditCollectionModal from '$lib/client/components/collections/card/EditCollectionModal.svelte';
	import CollectionsPostUpdateModal from '$lib/client/components/collections/CollectionPostUpdateModal.svelte';
	import DeleteCommentConfirmationModal from '$lib/client/components/comments/DeleteCommentConfirmationModal.svelte';
	import EditCommentModal from '$lib/client/components/comments/EditCommentModal.svelte';
	import ImagePreviewModal from '$lib/client/components/images/ImagePreviewModal.svelte';
	import LabelMetadataModal from '$lib/client/components/labels/LabelMetadataModal.svelte';
	import Footer from '$lib/client/components/layout/Footer.svelte';
	import Navbar from '$lib/client/components/layout/Navbar.svelte';
	import DeletePostConfirmationModal from '$lib/client/components/posts/card/DeletePostConfirmationModal.svelte';
	import EditPostModal from '$lib/client/components/posts/card/EditPostModal.svelte';
	import PostCardReportModal from '$lib/client/components/posts/card/PostCardReportModal.svelte';
	import HiddenPostModal from '$lib/client/components/posts/container/HiddenPostModal.svelte';
	import GlobalSearchModal from '$lib/client/components/search/GlobalSearchModal.svelte';
	import { TOAST_DEFAULT_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal, initLayoutContexts } from '$lib/client/helpers/context';
	import {
		destroyDocumentEventListeners,
		registerDocumentEventListeners,
	} from '$lib/client/helpers/dom';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onMount } from 'svelte';
	import '../app.postcss';
	import type { LayoutData } from './$types';

	type Props = {
		data: LayoutData;
		children?: import('svelte').Snippet;
	};

	let { data, children }: Props = $props();

	initLayoutContexts(data);

	onMount(() => {
		registerDocumentEventListeners(data.user, data.userPreferences, getActiveModal());

		return () => {
			destroyDocumentEventListeners(data.user, data.userPreferences, getActiveModal());
		};
	});
</script>

<svelte:head>
	<meta property="og:site_name" content="Dexbooru" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
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
<EditCommentModal />
<DeleteCommentConfirmationModal />
<EditPostModal />
<DeletePostConfirmationModal />
<ImagePreviewModal />
<CollectionsPostUpdateModal />
<EditCollectionModal />
<DeleteCollectionConfirmationModal />
<LabelMetadataModal />
