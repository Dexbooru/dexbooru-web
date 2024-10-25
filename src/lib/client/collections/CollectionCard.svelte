<script lang="ts">
	import {
		COLLECTION_DESCRIPTION_PREVIEW_LENGTH,
		COLLECTION_TITLE_PREVIEW_LENGTH,
	} from '$lib/shared/constants/collections';
	import { PostCollection } from '@prisma/client';
	import { Button, Card } from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';

	interface Props {
		collection: PostCollection;
	}

	let { collection }: Props = $props();

	const title =
		collection.title.length > COLLECTION_TITLE_PREVIEW_LENGTH
			? collection.title.slice(0, COLLECTION_TITLE_PREVIEW_LENGTH) + '...'
			: collection.title;
	const description =
		collection.description.length > COLLECTION_DESCRIPTION_PREVIEW_LENGTH
			? collection.description.slice(0, COLLECTION_DESCRIPTION_PREVIEW_LENGTH) + '...'
			: collection.description;
	const nsfwThumbnail = collection.thumbnailImageUrls.find((imageUrl) => imageUrl.includes('nsfw'));
	const originalThumbnail = collection.thumbnailImageUrls.find((imageUrl) =>
		imageUrl.includes('original'),
	);
</script>

<Card img={collection.isNsfw ? nsfwThumbnail : originalThumbnail}>
	<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
		{title}
	</h5>
	<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
		{description}
	</p>
	<Button href="/collections/{collection.id}">
		See all posts <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
	</Button>
</Card>
