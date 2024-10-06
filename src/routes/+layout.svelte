<script lang="ts">
	import { page } from '$app/stores';
	import { getNotifications } from '$lib/client/api/notifications';
	import Footer from '$lib/client/components/layout/Footer.svelte';
	import Navbar from '$lib/client/components/layout/Navbar.svelte';
	import GlobalSearchModal from '$lib/client/components/search/GlobalSearchModal.svelte';
	import { TOAST_DEFAULT_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getDeviceDetectionDataFromWindow,
		registerDocumentEventListeners,
	} from '$lib/client/helpers/dom';
	import {
		deviceStore,
		isDesktopStore,
		isMobileStore,
		isTabletStore,
	} from '$lib/client/stores/device';
	import { scrollToTopButtonActiveStore, searchModalActiveStore } from '$lib/client/stores/layout';
	import { notificationStore } from '$lib/client/stores/notifications';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { NONEXISTENT_USER_ID } from '$lib/shared/constants/auth';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { IUserNotifications } from '$lib/shared/types/notifcations';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onDestroy, onMount } from 'svelte';
	import '../app.postcss';
	import { Button } from 'flowbite-svelte';
	import { ArrowUpOutline } from 'flowbite-svelte-icons';

	authenticatedUserStore.set($page.data.user.id !== NONEXISTENT_USER_ID ? $page.data.user : null);

	const pageUnsubscribe = page.subscribe((_) => {
		searchModalActiveStore.set(false);
	});

	onMount(async () => {
		registerDocumentEventListeners();

		const deviceData = getDeviceDetectionDataFromWindow();
		deviceStore.set(deviceData);

		const { isMobile, isDesktop, isTablet } = deviceData;
		isMobileStore.set(isMobile);
		isDesktopStore.set(isDesktop);
		isTabletStore.set(isTablet);

		if ($authenticatedUserStore) {
			const notificationResponse = await getNotifications();
			if (notificationResponse.ok) {
				const responseData: TApiResponse<IUserNotifications> = await notificationResponse.json();
				const notificationData: IUserNotifications = responseData.data;
				notificationStore.set(notificationData);
			}
		}
	});

	onDestroy(() => {
		pageUnsubscribe();
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
	<div class="relative">
		{#if $scrollToTopButtonActiveStore}
			<Button
				on:click={() => window.scroll({ top: 0, behavior: 'smooth' })}
				pill={true}
				size="xl"
				class="!p-2 !absolute right-0 bottom-0"><ArrowUpOutline class="w-6 h-6" /></Button
			>
		{/if}
	</div>

	<slot />
</div>
<Footer />
<SvelteToast options={TOAST_DEFAULT_OPTIONS} />
<GlobalSearchModal />
