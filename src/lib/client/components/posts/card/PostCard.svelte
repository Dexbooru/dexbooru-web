<script lang="ts">
	import ImageCarousel from '$lib/client/components/images/ImageCarousel.svelte';
	import PostCardBody from '$lib/client/components/posts/card/PostCardBody.svelte';
	import { HIDDEN_POSTS_MODAL_NAME } from '$lib/client/constants/layout';
	import {
		POST_CARD_CAROUSEL_SLIDE_DURATION,
		POST_CARD_CAROUSEL_TRANSITION_FUNCTION,
	} from '$lib/client/constants/posts';
	import { getActiveModal, getAuthenticatedUserPreferences } from '$lib/client/helpers/context';
	import {
		IMAGE_FILTER_EXCLUSION_BASE_URLS,
		NSFW_PREVIEW_IMAGE_SUFFIX,
		PREVIEW_IMAGE_SUFFIX,
	} from '$lib/shared/constants/images';
	import type { TPost } from '$lib/shared/types/posts';
	import Card from 'flowbite-svelte/Card.svelte';
	import Toast from 'flowbite-svelte/Toast.svelte';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import { onMount } from 'svelte';

	type Props = {
		post: TPost;
		onCollectionViewPage?: boolean;
	};

	let { post, onCollectionViewPage = false }: Props = $props();

	const { id: postId, tags, artists, isNsfw } = post;
	let imageUrls = $state(post.imageUrls);

	const imagesAlt = `${tags.map((tag) => tag.name).join(', ')} by ${artists.map((artist) => artist.name).join(', ')}`;
	const userPreferences = getAuthenticatedUserPreferences();
	const activeModal = getActiveModal();

	const userPreferenceUnsubsribe = userPreferences.subscribe((data) => {
		const blurImages = isNsfw && data.autoBlurNsfw;
		imageUrls = imageUrls.filter((imageUrl) => {
			if (
				IMAGE_FILTER_EXCLUSION_BASE_URLS.some((exclusionBaseUrl) =>
					imageUrl.includes(exclusionBaseUrl),
				)
			) {
				return true;
			}

			return blurImages
				? imageUrl.endsWith(NSFW_PREVIEW_IMAGE_SUFFIX)
				: imageUrl.endsWith(PREVIEW_IMAGE_SUFFIX) && !imageUrl.endsWith(NSFW_PREVIEW_IMAGE_SUFFIX);
		});
	});

	onMount(() => {
		return () => {
			userPreferenceUnsubsribe();
		};
	});
</script>

{#if $userPreferences.hidePostMetadataOnPreview && !onCollectionViewPage}
	<ImageCarousel
		resourceType="posts"
		resourceHref="/posts/{postId}"
		{imageUrls}
		{imagesAlt}
		slideDuration={POST_CARD_CAROUSEL_SLIDE_DURATION}
		transitionFunction={POST_CARD_CAROUSEL_TRANSITION_FUNCTION}
	/>
{:else}
	<Card class="self-start">
		{#if isNsfw && $userPreferences.autoBlurNsfw && $activeModal.focusedModalName !== HIDDEN_POSTS_MODAL_NAME}
			<Toast
				dismissable={false}
				divClass="w-full max-w-xs p-4 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3 mt-2 mb-2"
				contentClass="flex space-x-4 rtl:space-x-reverse divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-700"
			>
				<ExclamationCircleSolid class="w-5 h-5 text-primary-600 dark:text-primary-500" />
				<div class="ps-4 text-sm font-normal">This post is marked as NSFW!</div>
			</Toast>
		{/if}

		<ImageCarousel
			resourceType="posts"
			resourceHref="/posts/{postId}"
			{imageUrls}
			{imagesAlt}
			slideDuration={POST_CARD_CAROUSEL_SLIDE_DURATION}
			transitionFunction={POST_CARD_CAROUSEL_TRANSITION_FUNCTION}
		/>
		<PostCardBody {post} />
	</Card>
{/if}
