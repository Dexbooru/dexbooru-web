<script lang="ts">
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { getFaviconFromUrl } from '$lib/client/helpers/urls';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { Artist, Tag } from '@prisma/client';
	import Img from 'flowbite-svelte/Img.svelte';

	type Props = {
		metadata: (Tag & Artist) | undefined;
		labelType: 'tag' | 'artist' | undefined;
	};

	let { metadata, labelType }: Props = $props();
	let displayedSocialMediaLinks = $derived(
		metadata?.socialMediaLinks.filter((link) => link.length > 0) ?? [],
	);
</script>

{#if metadata && labelType}
	<div class=" text-gray-800 dark:text-gray-300">
		<p class="font-semibold text-md">ID:</p>
		<span class="block mb-4 text-sm text-gray-600 dark:text-gray-400">{metadata.id}</span>

		<p class="font-semibold text-md">Description:</p>
		<span class="block mb-4 text-sm text-gray-600 dark:text-gray-400">
			{metadata.description || 'No description available.'}
		</span>

		<p class="font-semibold text-md">Created At:</p>
		<span class="block mb-4 text-sm text-gray-600 dark:text-gray-400">
			{formatDate(new Date(metadata.createdAt))}
		</span>

		<p class="font-semibold text-md">Updated At:</p>
		<span class="block mb-4 text-sm text-gray-600 dark:text-gray-400">
			{formatDate(new Date(metadata.updatedAt))}
		</span>

		<p class="font-semibold text-md">Post Count:</p>
		<span class="block mb-4 text-sm text-gray-600 dark:text-gray-400">
			{formatNumberWithCommas(metadata.postCount)}
		</span>

		{#if labelType === 'artist'}
			<p class="font-semibold text-md mb-2">Social Media Links:</p>
			{#if displayedSocialMediaLinks.length === 0}
				<p class="text-sm text-gray-600 dark:text-gray-400">No social media links available.</p>
			{:else}
				<ul class="list-none mb-4">
					{#each displayedSocialMediaLinks as link}
						<li class="flex items-center gap-4 mb-2">
							<Img src={getFaviconFromUrl(link)} alt="social-icon" class="w-4 h-4" />
							<a
								href={link}
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-500 hover:underline dark:text-blue-300"
							>
								{link}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
{/if}
