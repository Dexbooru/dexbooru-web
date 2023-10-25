<script lang="ts">
	import type { IPost } from '$lib/shared/types/posts';
	import { Card, Button } from 'flowbite-svelte';
	import PostCardBody from '$lib/client/components/posts/PostCardBody.svelte';
	import ImageCarousel from '$lib/client/components/images/ImageCarousel.svelte';

	export let post: IPost;
	const { id: postId, description, author, tags, artists, imageUrls, createdAt } = post;
</script>

<div>
	<Card class="w-96">
		<ImageCarousel {imageUrls} imagesAlt={description} slideDuration={750} />
		<PostCardBody {author} {createdAt} {tags} {artists} />
		<Button href="/posts/{postId}" class="w-full" color="blue">View full post</Button>
	</Card>
</div>
