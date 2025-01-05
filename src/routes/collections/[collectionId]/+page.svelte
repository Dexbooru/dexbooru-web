<script lang="ts">
	import CollectionPresentation from '$lib/client/components/collections/CollectionPresentation.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<main class="m-5 space-y-5">
	<CollectionPresentation collection={data.collection} />
</main>
