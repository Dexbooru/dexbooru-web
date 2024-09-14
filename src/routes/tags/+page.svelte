<script lang="ts">
	import LabelGrid from '$lib/client/components/labels/LabelGrid.svelte';
</script>

<svelte:head>
	<title>Find tags</title>
	<meta property="og:title" content="Find Tags on Dexbooru" />
	<meta
		property="og:description"
		content="Explore tags from A to Z and 0 to 9 on Dexbooru. Select the tags you're interested in or discover new ones."
	/>
</svelte:head>

<LabelGrid labelType="tag" />
