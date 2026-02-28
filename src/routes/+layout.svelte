<script lang="ts">
	import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import DeleteCollectionConfirmationModal from '$lib/client/components/collections/card/DeleteCollectionConfirmationModal.svelte';
	import EditCollectionModal from '$lib/client/components/collections/card/EditCollectionModal.svelte';
	import CollectionsPostUpdateModal from '$lib/client/components/collections/CollectionPostUpdateModal.svelte';
	import DeleteCommentConfirmationModal from '$lib/client/components/comments/DeleteCommentConfirmationModal.svelte';
	import EditCommentModal from '$lib/client/components/comments/EditCommentModal.svelte';
	import ImagePreviewModal from '$lib/client/components/images/ImagePreviewModal.svelte';
	import LabelMetadataModal from '$lib/client/components/labels/LabelMetadataModal.svelte';
	import EmailVerificationBanner from '$lib/client/components/auth/EmailVerificationBanner.svelte';
	import Footer from '$lib/client/components/layout/Footer.svelte';
	import Navbar from '$lib/client/components/layout/Navbar.svelte';
	import PromoteModModal from '$lib/client/components/moderation/PromoteModModal.svelte';
	import ReportListModal from '$lib/client/components/moderation/ReportListModal.svelte';
	import ReportModal from '$lib/client/components/moderation/ReportModal.svelte';
	import DeletePostConfirmationModal from '$lib/client/components/posts/card/DeletePostConfirmationModal.svelte';
	import EditPostModal from '$lib/client/components/posts/card/EditPostModal.svelte';
	import HiddenPostModal from '$lib/client/components/posts/container/HiddenPostModal.svelte';
	import GlobalSearchModal from '$lib/client/components/search/GlobalSearchModal.svelte';
	import { SUCCESS_TOAST_OPTIONS, TOAST_DEFAULT_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal, initLayoutContexts } from '$lib/client/helpers/context';
	import {
		destroyDocumentEventListeners,
		registerDocumentEventListeners,
	} from '$lib/client/helpers/dom';
	import { toast } from '@zerodevx/svelte-toast';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import NProgress from 'nprogress';
	import 'nprogress/nprogress.css';
	import { onMount } from 'svelte';
	import '../app.css';
	import type { LayoutData } from './$types';

	NProgress.configure({ showSpinner: false });

	type Props = {
		data: LayoutData;
		children?: import('svelte').Snippet;
	};

	let { data, children }: Props = $props();

	// svelte-ignore state_referenced_locally
	initLayoutContexts(data);

	onMount(() => {
		registerDocumentEventListeners(data.user, data.userPreferences, getActiveModal());

		return () => {
			destroyDocumentEventListeners(data.user, data.userPreferences, getActiveModal());
		};
	});

	$effect(() => {
		if (page.url.searchParams.get('emailVerified') === 'true') {
			toast.push('Email verified successfully!', SUCCESS_TOAST_OPTIONS);
			const url = new URL(page.url);
			url.searchParams.delete('emailVerified');
			goto(url.pathname + url.search, { replaceState: true });
		}
	});

	beforeNavigate(() => {
		NProgress.start();
	});

	afterNavigate(() => {
		NProgress.done();
	});
</script>

<svelte:head>
	<meta property="og:site_name" content="Dexbooru" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
	<meta property="og:locale" content="en_US" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!--- Main application layout -->
	<Navbar />
	<EmailVerificationBanner emailVerified={data.user.emailVerified ?? false} userId={data.user.id} />
	<div class="grow">
		{@render children?.()}
	</div>
	{#if page.route.id === '/'}
		<Footer />
	{/if}
</div>

<!-- Reusable app toast -->
<SvelteToast options={TOAST_DEFAULT_OPTIONS} />

<!-- Modals -->
<GlobalSearchModal />
<HiddenPostModal />
<ReportModal reportType="user" />
<ReportModal reportType="post" />
<ReportModal reportType="collection" />
<ReportListModal reportType="userReports" />
<ReportListModal reportType="postCollectionReports" />
<ReportListModal reportType="postReports" />
<EditCommentModal />
<DeleteCommentConfirmationModal />
<EditPostModal />
<DeletePostConfirmationModal />
<ImagePreviewModal />
<CollectionsPostUpdateModal />
<EditCollectionModal />
<DeleteCollectionConfirmationModal />
<LabelMetadataModal />
<PromoteModModal />
