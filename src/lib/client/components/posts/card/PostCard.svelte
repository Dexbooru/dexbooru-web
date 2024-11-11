<script lang="ts">
	import ImageCarousel from '$lib/client/components/images/ImageCarousel.svelte';
	import PostCardBody from '$lib/client/components/posts/card/PostCardBody.svelte';
	import { HIDDEN_POSTS_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal, getAuthenticatedUserPreferences } from '$lib/client/helpers/context';
	import {
		IMAGE_FILTER_EXCLUSION_BASE_URLS,
		NSFW_PREVIEW_IMAGE_SUFFIX,
		PREVIEW_IMAGE_SUFFIX,
	} from '$lib/shared/constants/images';
	import type { TPost } from '$lib/shared/types/posts';
	import { Card, Toast } from 'flowbite-svelte';
	import { ExclamationCircleSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import PostCardActions from './PostCardActions.svelte';

	interface Props {
		post: TPost;
		onCollectionViewPage?: boolean;
	}

	let { post, onCollectionViewPage = false }: Props = $props();

	const { id: postId, description, author, tags, artists, createdAt, isNsfw } = post;
	let imageUrls = $state(post.imageUrls);
	let likes = post.likes;

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
		imagesAlt={description}
		slideDuration={350}
		transitionFunction={(x) => scale(x, { duration: 500, easing: quintOut })}
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
			imagesAlt={description}
			slideDuration={350}
			transitionFunction={(x) => scale(x, { duration: 500, easing: quintOut })}
		/>
		<PostCardBody {post} {author} {createdAt} {tags} {artists} />
		<PostCardActions {post} {author} {likes} {postId} />
	</Card>
{/if}
