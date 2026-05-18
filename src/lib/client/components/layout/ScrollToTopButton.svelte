<script lang="ts">
	import { page } from '$app/state';
	import { SCROLL_TO_TOP_VISIBILITY_THRESHOLD_PX } from '$lib/client/constants/layout';
	import ArrowUpOutline from 'flowbite-svelte-icons/ArrowUpOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import { onMount } from 'svelte';

	let isVisible: boolean = $state(false);
	const isHomePage: boolean = $derived(page.route.id === '/');

	const updateVisibility = () => {
		isVisible = window.scrollY > SCROLL_TO_TOP_VISIBILITY_THRESHOLD_PX;
	};

	const onScrollToTop = () => {
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({
			top: 0,
			behavior: reducedMotion ? 'auto' : 'smooth',
		});
	};

	onMount(() => {
		updateVisibility();
		window.addEventListener('scroll', updateVisibility, { passive: true });

		return () => {
			window.removeEventListener('scroll', updateVisibility);
		};
	});
</script>

<div
	class="fixed inset-e-6 {isHomePage
		? 'bottom-20'
		: 'bottom-6'} z-40 transition-opacity duration-300 {isVisible
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
>
	<Button
		color="blue"
		size="sm"
		pill
		class="p-3! shadow-lg sm:p-4! md:p-5!"
		aria-label="Scroll to top"
		onclick={onScrollToTop}
	>
		<ArrowUpOutline class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" aria-hidden="true" />
	</Button>
</div>
