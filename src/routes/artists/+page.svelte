<script lang="ts">
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import LabelGrid from '$lib/client/components/labels/LabelGrid.svelte';
	import { CHAR_OPTIONS_DIGITS, CHAR_OPTIONS_LOWERCASE } from '$lib/client/constants/labels';
</script>

<svelte:head>
	<title>Find artists</title>
	<meta property="og:title" content="Find Artists on Dexbooru" />
	<meta
		property="og:description"
		content="Explore artists from {CHAR_OPTIONS_LOWERCASE[0]} to {CHAR_OPTIONS_LOWERCASE[
			CHAR_OPTIONS_LOWERCASE.length - 1
		]} and {CHAR_OPTIONS_DIGITS[0]} to {CHAR_OPTIONS_DIGITS[
			CHAR_OPTIONS_DIGITS.length - 1
		]} on Dexbooru. Select the artists you're interested in or discover new ones."
	/>
	<meta property="og:image" content={ApplicationLogo} />
</svelte:head>

<LabelGrid labelType="artist" />
