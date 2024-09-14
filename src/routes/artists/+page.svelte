<script lang="ts">
	import LabelGrid from '$lib/client/components/labels/LabelGrid.svelte';
</script>

<svelte:head>
	<title>Find artists</title>
	<meta property="og:title" content="Find Artists on Dexbooru" />
	<meta
		property="og:description"
		content="Explore artists from A to Z and 0 to 9 on Dexbooru. Select your favorite artist or discover new ones."
	/>
</svelte:head>

<LabelGrid labelType="artist" />
