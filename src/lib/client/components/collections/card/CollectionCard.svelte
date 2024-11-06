<script lang="ts">
	import { getAuthenticatedUserPreferences } from '$lib/client/helpers/context';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import {
		COLLECTION_DESCRIPTION_PREVIEW_LENGTH,
		COLLECTION_TITLE_PREVIEW_LENGTH,
	} from '$lib/shared/constants/collections';
	import {
		COLLECTION_THUMBNAIL_HEIGHT,
		COLLECTION_THUMBNAIL_WIDTH,
	} from '$lib/shared/constants/images';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import { Avatar, Card } from 'flowbite-svelte';
	import CollectionCardActions from './CollectionCardActions.svelte';

	interface Props {
		collection: TPostCollection;
	}

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
	const nsfwThumbnail = collection.thumbnailImageUrls.find((imageUrl) => imageUrl.includes('nsfw'));
	const originalThumbnail = collection.thumbnailImageUrls.find((imageUrl) =>
		imageUrl.includes('original'),
	);
</script>

{#if $userPreferences.hideCollectionMetadataOnPreview}
	<a href="/collections/{collection.id}">
		<img
			loading="lazy"
			width={COLLECTION_THUMBNAIL_WIDTH}
			height={COLLECTION_THUMBNAIL_HEIGHT}
			class="block p-3 collection-preview-image"
			src={collection.isNsfw && $userPreferences.autoBlurNsfw ? nsfwThumbnail : originalThumbnail}
			alt={collection.description}
		/>
	</a>
{:else}
	<Card>
		<a href="/collections/{collection.id}">
			<img
				loading="lazy"
				width={COLLECTION_THUMBNAIL_WIDTH}
				height={COLLECTION_THUMBNAIL_HEIGHT}
				class="block mb-3 object-cover collection-preview-image"
				src={collection.isNsfw && $userPreferences.autoBlurNsfw ? nsfwThumbnail : originalThumbnail}
				alt={collection.description}
			/>
		</a>
		{#if !$userPreferences.hideCollectionMetadataOnPreview}
			<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
				{title}
			</h5>
			<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
				{description}
			</p>
			<div class="space-x-2 flex align-middle flex-wrap mb-2">
				<a
					class="inline-flex align-middle space-x-2"
					href={collection.authorId && `/profile/${collection.author.username}`}
				>
					<Avatar
						size="md"
						class="hide-alt-text booru-avatar-collection-card"
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
			<p class="text-base dark:text-white cursor-text">Created Date</p>
			<div class="space-x-2 flex align-middle flex-wrap">
				<p class="text-md dark:text-white cursor-text">
					<span class="leading-none text-sm dark:text-gray-400"
						>{formatDate(collection.createdAt)}</span
					>
				</p>
			</div>

			<CollectionCardActions {collection} />
		{/if}
	</Card>
{/if}
