<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import CloseOutline from 'flowbite-svelte-icons/CloseOutline.svelte';
	import FilterOutline from 'flowbite-svelte-icons/FilterOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import { onMount, type Snippet } from 'svelte';

	type Props = {
		label?: string;
		children?: Snippet;
	};

	let { label = 'Filters', children }: Props = $props();
	let open = $state(false);
	let overlayEl: HTMLDivElement | undefined = $state();
	let panelEl: HTMLElement | undefined = $state();

	const closeDrawer = () => {
		open = false;
	};

	const openDrawer = () => {
		open = true;
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape' && open) {
			closeDrawer();
		}
	};

	afterNavigate(() => {
		closeDrawer();
	});

	onMount(() => {
		const overlay = overlayEl;
		const panel = panelEl;
		if (overlay) document.body.appendChild(overlay);
		if (panel) document.body.appendChild(panel);

		return () => {
			overlay?.remove();
			panel?.remove();
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="md:hidden">
	<Button type="button" color="alternative" class="w-full sm:w-auto" onclick={openDrawer}>
		<FilterOutline class="mr-2 h-4 w-4" />
		{label}
	</Button>
</div>

<div
	bind:this={overlayEl}
	class="fixed inset-0 z-[60] bg-gray-900/50 md:hidden {open
		? 'pointer-events-auto opacity-100'
		: 'pointer-events-none opacity-0'}"
	role="presentation"
	onclick={closeDrawer}
></div>

<div
	bind:this={panelEl}
	class="fixed inset-y-0 left-0 z-[70] flex h-dvh min-h-dvh w-[min(20rem,100vw)] flex-col overflow-y-auto border-r border-gray-200 bg-white p-4 transition-transform duration-200 md:hidden dark:border-gray-700 dark:bg-gray-800 {open
		? 'translate-x-0'
		: 'pointer-events-none -translate-x-full'}"
	role="dialog"
	aria-modal="true"
	aria-label={label}
	aria-hidden={!open}
	inert={!open}
>
	<div class="mb-2 flex shrink-0 items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900 dark:text-white">{label}</h2>
		<button
			type="button"
			class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
			aria-label="Close drawer"
			onclick={closeDrawer}
		>
			<CloseOutline class="h-5 w-5" />
		</button>
	</div>
	<div class="min-h-0 flex-1 overflow-y-auto pb-8">
		{@render children?.()}
	</div>
</div>
