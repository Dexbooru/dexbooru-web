<script lang="ts">
	import DefaultPostPicture from '$lib/client/assets/default_post_picture.webp';
	import ImageCarousel from '$lib/client/components/images/ImageCarousel.svelte';
	import PostCardBody from '$lib/client/components/posts/card/PostCardBody.svelte';
	import PostCardTooltip from '$lib/client/components/posts/card/PostCardTooltip.svelte';
	import { HIDDEN_POSTS_MODAL_NAME } from '$lib/client/constants/layout';
	import {
		POST_CARD_CAROUSEL_SLIDE_DURATION,
		POST_CARD_CAROUSEL_TRANSITION_FUNCTION,
	} from '$lib/client/constants/posts';
	import { getActiveModal, getAuthenticatedUserPreferences } from '$lib/client/helpers/context';
	import {
		IMAGE_FILTER_EXCLUSION_BASE_URLS,
		NSFW_PREVIEW_IMAGE_SUFFIX,
		POST_CAROUSEL_IMAGE_CLASS_NAME,
		POST_PICTURE_PREVIEW_HEIGHT,
		POST_PICTURE_PREVIEW_WIDTH,
		PREVIEW_IMAGE_SUFFIX,
	} from '$lib/shared/constants/images';
	import type { TPost } from '$lib/shared/types/posts';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Toast from 'flowbite-svelte/Toast.svelte';

	type Props = {
		post: TPost;
		onCollectionViewPage?: boolean;
	};

	let { post, onCollectionViewPage = false }: Props = $props();

	const { id: postId, tags, artists, isNsfw } = $derived(post);
	const userPreferences = getAuthenticatedUserPreferences();
	const activeModal = getActiveModal();

	const imagesAlt = $derived.by(() => {
		return `${tags.map((tag) => tag.name).join(', ')} by ${artists
			.map((artist) => artist.name)
			.join(', ')}`;
	});

	const imageUrls = $derived.by(() => {
		const blurImages = isNsfw && $userPreferences.autoBlurNsfw;

		return post.imageUrls.filter((imageUrl) => {
			if (
				IMAGE_FILTER_EXCLUSION_BASE_URLS.some((exclusionBaseUrl) =>
					imageUrl.includes(exclusionBaseUrl),
				)
			) {
				return true;
			}

			if (blurImages) {
				return imageUrl.endsWith(NSFW_PREVIEW_IMAGE_SUFFIX);
			}

			return (
				imageUrl.endsWith(PREVIEW_IMAGE_SUFFIX) && !imageUrl.endsWith(NSFW_PREVIEW_IMAGE_SUFFIX)
			);
		});
	});

	const showCarousel = $derived(imageUrls.length > 1);
</script>

{#if $userPreferences.hidePostMetadataOnPreview && !onCollectionViewPage}
	<PostCardTooltip {artists} {tags}>
		{#if showCarousel}
			<ImageCarousel
				resourceType="posts"
				resourceHref="/posts/{postId}"
				{imageUrls}
				{imagesAlt}
				slideDuration={POST_CARD_CAROUSEL_SLIDE_DURATION}
				transitionFunction={POST_CARD_CAROUSEL_TRANSITION_FUNCTION}
			/>
		{:else if imageUrls.length === 1}
			<a href="/posts/{postId}">
				<img
					src={imageUrls[0]}
					alt={imagesAlt}
					width={POST_PICTURE_PREVIEW_WIDTH}
					height={POST_PICTURE_PREVIEW_HEIGHT}
					loading="lazy"
					class="object-contain {POST_CAROUSEL_IMAGE_CLASS_NAME}"
					style="transition: opacity 0.5s; opacity: 0;"
					onload={(e) => {
						(e.target as HTMLImageElement).style.opacity = '1.0';
					}}
					onerror={(e) => {
						(e.target as HTMLImageElement).src = DefaultPostPicture;
					}}
				/>
			</a>
		{/if}
	</PostCardTooltip>
{:else}
	<Card class="self-start">
		{#if isNsfw && $userPreferences.autoBlurNsfw && $activeModal.focusedModalName !== HIDDEN_POSTS_MODAL_NAME}
			<Toast
				dismissable={false}
				class="mt-2 mb-2 w-full max-w-xs gap-3 bg-white p-4 text-gray-500 shadow dark:bg-gray-700 dark:text-gray-400"
				contentClass="flex space-x-4 rtl:space-x-reverse divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-700"
			>
				<ExclamationCircleSolid class="text-primary-600 dark:text-primary-500 h-5 w-5" />
				<div class="ps-4 text-sm font-normal">This post is marked as NSFW!</div>
			</Toast>
		{/if}

		{#if showCarousel}
			<ImageCarousel
				resourceType="posts"
				resourceHref="/posts/{postId}"
				{imageUrls}
				{imagesAlt}
				slideDuration={POST_CARD_CAROUSEL_SLIDE_DURATION}
				transitionFunction={POST_CARD_CAROUSEL_TRANSITION_FUNCTION}
			/>
		{:else if imageUrls.length === 1}
			<a href="/posts/{postId}">
				<img
					src={imageUrls[0]}
					alt={imagesAlt}
					width={POST_PICTURE_PREVIEW_WIDTH}
					height={POST_PICTURE_PREVIEW_HEIGHT}
					loading="lazy"
					class="object-contain {POST_CAROUSEL_IMAGE_CLASS_NAME}"
					style="transition: opacity 0.5s; opacity: 0;"
					onload={(e) => {
						(e.target as HTMLImageElement).style.opacity = '1.0';
					}}
					onerror={(e) => {
						(e.target as HTMLImageElement).src = DefaultPostPicture;
					}}
				/>
			</a>
		{/if}
		<PostCardBody {post} />
	</Card>
{/if}
