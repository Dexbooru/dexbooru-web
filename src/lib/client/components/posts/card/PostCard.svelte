<script lang="ts">
	import ImageCarousel from '$lib/client/components/images/ImageCarousel.svelte';
	import PostCardBody from '$lib/client/components/posts/card/PostCardBody.svelte';
	import type { IPost } from '$lib/shared/types/posts';
	import { Card } from 'flowbite-svelte';
	import PostCardActions from './PostCardActions.svelte';

	export let post: IPost;

	const { id: postId, description, author, tags, artists, imageUrls, createdAt } = post;
	let likes = post.likes;
</script>

<Card>
	<ImageCarousel
		postHref="/posts/{postId}"
		{imageUrls}
		imagesAlt={description}
		slideDuration={750}
	/>
	<PostCardBody {post} {author} {createdAt} {tags} {artists} />
	<PostCardActions {post} {author} {likes} {postId} />
</Card>
