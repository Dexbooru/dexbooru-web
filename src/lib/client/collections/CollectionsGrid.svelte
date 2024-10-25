<script lang="ts">
	import { getCollectionPaginationData } from '../helpers/context';
	import CollectionCard from './CollectionCard.svelte';

	const collectionPagination = getCollectionPaginationData();
</script>

<div
	class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 place-items-center mt-5 mb-5 p-4"
>
	{#each $collectionPagination?.collections ?? [] as collection}
		<CollectionCard {collection} />
	{/each}
</div>
