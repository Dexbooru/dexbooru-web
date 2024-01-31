<script lang="ts">
	import { page } from '$app/stores';
	import { getNotifications } from '$lib/client/api/notifications';
	import Footer from '$lib/client/components/layout/Footer.svelte';
	import Navbar from '$lib/client/components/layout/Navbar.svelte';
	import { TOAST_DEFAULT_OPTIONS } from '$lib/client/constants/toasts';
	import { getDeviceDetectionDataFromWindow } from '$lib/client/helpers/dom';
	import {
		deviceStore,
		isDesktopStore,
		isMobileStore,
		isTabletStore
	} from '$lib/client/stores/device';
	import { notificationStore } from '$lib/client/stores/notifications';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import type { IUserNotifications } from '$lib/shared/types/notifcations';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onMount } from 'svelte';
	import '../app.postcss';

	authenticatedUserStore.set($page.data.user || null);

	onMount(async () => {
		const deviceData = getDeviceDetectionDataFromWindow();
		deviceStore.set(deviceData);

		const { isMobile, isDesktop, isTablet } = deviceData;
		isMobileStore.set(isMobile);
		isDesktopStore.set(isDesktop);
		isTabletStore.set(isTablet);

		const notificationResponse = await getNotifications();
		if (notificationResponse.ok) {
			const notificationData: IUserNotifications = await notificationResponse.json();
			notificationStore.set(notificationData);
		}
	});
</script>

<Navbar />
<div style="flex:1">
	<slot />
</div>
<Footer />
<SvelteToast options={TOAST_DEFAULT_OPTIONS} />
