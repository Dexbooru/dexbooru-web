<script lang="ts">
	export let imageUrls: string[];
	export let imagesAlt: string;
</script>

<div class="flex flex-wrap">
{#each imageUrls as imageUrl}
	<img class="m-2" src={imageUrl} alt={imagesAlt} />
{/each}
</div>

