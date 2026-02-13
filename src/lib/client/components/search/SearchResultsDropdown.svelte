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
		class="absolute top-10 right-0 left-0 z-50 mx-auto mt-2 max-h-80 w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
		in:slide
		out:fade
	>
		{#if tags.length > 0}
			<h2
				class="sticky top-0 z-10 bg-white px-4 py-2 text-left font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200"
			>
				Tags:
			</h2>
			<ul class="flex flex-col">
				{#each tags as tag (tag.id)}
					<button
						type="button"
						onclick={() => onLabelClick(tag.name)}
						class="flex cursor-pointer items-center space-x-2 rounded-md px-4 py-2 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<TagSolid class="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
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
				class="sticky top-0 z-10 bg-white px-4 py-2 text-left font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200"
			>
				Artists:
			</h2>
			<ul class="flex flex-col">
				{#each artists as artist (artist.id)}
					<button
						type="button"
						onclick={() => onLabelClick(artist.name)}
						class="flex cursor-pointer items-center rounded-md px-4 py-2 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<PalleteSolid class="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
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
