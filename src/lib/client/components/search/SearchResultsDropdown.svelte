<script lang="ts">
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import type { TAppSearchResult } from '$lib/shared/types/search';
	import PalleteSolid from 'flowbite-svelte-icons/PaletteSolid.svelte';
	import TagSolid from 'flowbite-svelte-icons/TagSolid.svelte';
	import { fade, slide } from 'svelte/transition';

	type Props = {
		results: TAppSearchResult;
	};

	let { results }: Props = $props();
	let tags = $derived(results.tags ?? []);
	let artists = $derived(results.artists ?? []);

	const onLabelClick = (labelName: string) => {
		const searchInput = document.getElementById('advanced-searchbar') as HTMLInputElement;
		const tokens = searchInput.value.split(' ');
		tokens[tokens.length - 1] = labelName;
		searchInput.value = tokens.join(' ') + ' ';

		searchInput.focus();
	};
</script>

{#if (tags?.length ?? 0) > 0 || (artists?.length ?? 0) > 0}
	<div
		class="absolute left-auto right-auto top-10 mt-2 w-1/2 min-w-[300px] max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-md rounded-lg"
		in:slide
		out:fade
	>
		{#if tags.length > 0}
			<h2
				class="text-left px-4 py-2 font-semibold text-gray-800 dark:text-gray-200 sticky top-0 bg-white dark:bg-gray-800 z-10"
			>
				Tags:
			</h2>
			<ul class="flex flex-col">
				{#each tags as tag (tag.id)}
					<button
						type="button"
						onclick={() => onLabelClick(tag.name)}
						class="flex space-x-2 items-center px-4 py-2 transition-all duration-150 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<TagSolid class="w-5 h-5 mr-2 text-gray-700 dark:text-gray-300" />
						<span class="text-gray-900 dark:text-gray-100">{tag.name + ' '}</span>
						<span class="text-gray-900 dark:text-gray-100">
							[{formatNumberWithCommas(tag.postCount)}]</span
						>
					</button>
				{/each}
			</ul>
		{/if}

		{#if artists.length > 0}
			<h2
				class="text-left px-4 py-2 font-semibold text-gray-800 dark:text-gray-200 sticky top-0 bg-white dark:bg-gray-800 z-10"
			>
				Artists:
			</h2>
			<ul class="flex flex-col">
				{#each artists as artist (artist.id)}
					<button
						type="button"
						onclick={() => onLabelClick(artist.name)}
						class="flex items-center px-4 py-2 transition-all duration-150 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<PalleteSolid class="w-5 h-5 mr-2 text-gray-700 dark:text-gray-300" />
						<span class="text-gray-900 dark:text-gray-100">{artist.name + ' '}</span>
						<span class="text-gray-900 dark:text-gray-100">
							[{formatNumberWithCommas(artist.postCount)}]</span
						>
					</button>
				{/each}
			</ul>
		{/if}
	</div>
{/if}
