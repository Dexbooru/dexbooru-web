<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	type Props = {
		pageNumber?: number;
	};

	let { pageNumber = 0 }: Props = $props();
</script>

<Heading tag="h1" class="text-center">No posts found on page {pageNumber + 1}</Heading>
