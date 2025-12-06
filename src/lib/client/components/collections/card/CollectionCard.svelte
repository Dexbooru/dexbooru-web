<script lang="ts">
	import { getAuthenticatedUserPreferences } from '$lib/client/helpers/context';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import {
		COLLECTION_DESCRIPTION_PREVIEW_LENGTH,
		COLLECTION_TITLE_PREVIEW_LENGTH,
	} from '$lib/shared/constants/collections';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import ImageCarousel from '../../images/ImageCarousel.svelte';

	type Props = {
		collection: TPostCollection;
	};

	let { collection }: Props = $props();
	let title = $derived.by(() => {
		return collection.title.length > COLLECTION_TITLE_PREVIEW_LENGTH
			? collection.title.slice(0, COLLECTION_TITLE_PREVIEW_LENGTH) + '...'
			: collection.title;
	});
	let description = $derived.by(() => {
		return collection.description.length > COLLECTION_DESCRIPTION_PREVIEW_LENGTH
			? collection.description.slice(0, COLLECTION_DESCRIPTION_PREVIEW_LENGTH) + '...'
			: collection.description;
	});

	const userPreferences = getAuthenticatedUserPreferences();
	const nsfwThumbnail =
		collection.thumbnailImageUrls.find((imageUrl) => imageUrl.includes('nsfw')) ?? '';
	const originalThumbnail =
		collection.thumbnailImageUrls.find(
			(imageUrl) => imageUrl.includes('preview') && !imageUrl.includes('nsfw'),
		) ?? '';
</script>

{#if $userPreferences.hideCollectionMetadataOnPreview}
	<ImageCarousel
		imagesAlt={collection.description}
		imageUrls={[
			collection.isNsfw && $userPreferences.autoBlurNsfw ? nsfwThumbnail : originalThumbnail,
		]}
		resourceType="collections"
		resourceHref="/collections/{collection.id}"
	/>
{:else}
	<Card class="p-4 sm:p-6 md:p-8">
		<ImageCarousel
			imagesAlt={collection.description}
			imageUrls={[
				collection.isNsfw && $userPreferences.autoBlurNsfw ? nsfwThumbnail : originalThumbnail,
			]}
			resourceType="collections"
			resourceHref="/collections/{collection.id}"
		/>
		{#if !$userPreferences.hideCollectionMetadataOnPreview}
			<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
				{title}
			</h5>
			<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
				{description}
			</p>
			<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
				{formatNumberWithCommas(collection.posts.length)} post(s)
			</p>
			<div class="space-x-2 flex align-middle flex-wrap mb-2">
				<a
					class="inline-flex align-middle space-x-2"
					href={collection.authorId && `/profile/${collection.author.username}`}
				>
					<Avatar
						size="md"
						class="hide-alt-text"
						src={collection.author.profilePictureUrl}
						alt={collection.authorId
							? `profile picture of ${collection.author.username}`
							: 'default user account'}
					/>
					<p class="mt-2">
						{collection.authorId ? collection.author.username : DELETED_ACCOUNT_HEADING}
					</p>
				</a>
			</div>
			<p class="text-base dark:text-white">Created Date</p>
			<div class="space-x-2 flex align-middle flex-wrap">
				<p class="text-md dark:text-white">
					<span class="leading-none text-sm dark:text-gray-400"
						>{formatDate(collection.createdAt)}</span
					>
				</p>
			</div>
		{/if}
	</Card>
{/if}
