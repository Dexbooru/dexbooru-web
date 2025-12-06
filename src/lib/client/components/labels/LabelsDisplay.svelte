<script lang="ts">
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { renderLabel } from '$lib/shared/helpers/labels';
	import type { TPost } from '$lib/shared/types/posts';
	import PalleteSolid from 'flowbite-svelte-icons/PaletteSolid.svelte';
	import TagSolid from 'flowbite-svelte-icons/TagSolid.svelte';

	type Props = {
		labels: (TPost['tags'][number] | TPost['artists'][number])[];
		labelType: 'tag' | 'artist';
	};

	let { labels, labelType }: Props = $props();
</script>

<div class="flex flex-wrap gap-1">
	{#each labels as label}
		<div
			class="text-center inline-flex items-center justify-center space-x-2 border rounded px-2 py-1 text-xs leading-none dark:text-gray-400"
		>
			<span>
				{renderLabel(label.name, labelType, false)}
				{#if label.postCount}
					-
					{formatNumberWithCommas(label.postCount)}
				{/if}
			</span>
			{#if labelType === 'tag'}
				<TagSolid class="h-3 w-3" />
			{:else}
				<PalleteSolid class="h-3 w-3" />
			{/if}
		</div>
	{/each}
</div>
