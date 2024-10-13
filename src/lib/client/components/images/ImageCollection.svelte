<script lang="ts">
	export let imageUrls: string[];
	export let imagesAlt: string;
</script>

{#each imageUrls as imageUrl}
	<img class="m-2 whole-post-image" src={imageUrl} alt={imagesAlt} />
{/each}
