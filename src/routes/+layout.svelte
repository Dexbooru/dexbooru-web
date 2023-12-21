<script lang="ts">
	import '../app.postcss';
	import Footer from '$lib/client/components/layout/Footer.svelte';
	import Navbar from '$lib/client/components/layout/Navbar.svelte';
	import { onMount } from 'svelte';
	import { getDeviceDetectionDataFromWindow } from '$lib/client/helpers/dom';
	import {
		deviceStore,
		isDesktopStore,
		isMobileStore,
		isTabletStore
	} from '$lib/client/stores/device';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { TOAST_DEFAULT_OPTIONS } from '$lib/client/constants/toasts';

	onMount(() => {
		const deviceData = getDeviceDetectionDataFromWindow();
		deviceStore.set(deviceData);

		const { isMobile, isDesktop, isTablet } = deviceData;
		isMobileStore.set(isMobile);
		isDesktopStore.set(isDesktop);
		isTabletStore.set(isTablet);
	});


</script>

<Navbar />
<div style="flex:1">
	<slot />
</div>
<Footer />
<SvelteToast options={TOAST_DEFAULT_OPTIONS} />
