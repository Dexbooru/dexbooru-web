<script lang="ts">
	import type { Artist, Tag } from '$generated/prisma/browser';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { getFaviconFromUrl } from '$lib/client/helpers/urls';
	import { formatDate } from '$lib/shared/helpers/dates';
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
		<p class="text-md font-semibold">ID:</p>
		<span class="mb-4 block text-sm text-gray-600 dark:text-gray-400">{metadata.id}</span>

		<p class="text-md font-semibold">Description:</p>
		<span class="mb-4 block text-sm text-gray-600 dark:text-gray-400">
			{metadata.description || 'No description available.'}
		</span>

		<p class="text-md font-semibold">Created At:</p>
		<span class="mb-4 block text-sm text-gray-600 dark:text-gray-400">
			{formatDate(new Date(metadata.createdAt))}
		</span>

		<p class="text-md font-semibold">Updated At:</p>
		<span class="mb-4 block text-sm text-gray-600 dark:text-gray-400">
			{formatDate(new Date(metadata.updatedAt))}
		</span>

		<p class="text-md font-semibold">Post Count:</p>
		<span class="mb-4 block text-sm text-gray-600 dark:text-gray-400">
			{formatNumberWithCommas(metadata.postCount)}
		</span>

		{#if labelType === 'artist'}
			<p class="text-md mb-2 font-semibold">Social Media Links:</p>
			{#if displayedSocialMediaLinks.length === 0}
				<p class="text-sm text-gray-600 dark:text-gray-400">No social media links available.</p>
			{:else}
				<ul class="mb-4 list-none">
					{#each displayedSocialMediaLinks as link (link)}
						<li class="mb-2 flex items-center gap-4">
							<Img src={getFaviconFromUrl(link)} alt="social-icon" class="h-4 w-4" />
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
