<script lang="ts">
	import CollectionPresentation from '$lib/client/components/collections/CollectionPresentation.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<main class="p-4 md:p-8 container mx-auto space-y-6">
	<CollectionPresentation collection={data.collection} />
</main>
