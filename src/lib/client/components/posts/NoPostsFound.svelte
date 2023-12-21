<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	export let pageNumber: number = 0;
</script>

<Heading tag="h1" class="text-center">No posts found on page {pageNumber + 1}</Heading>
