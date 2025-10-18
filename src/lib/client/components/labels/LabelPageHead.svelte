<script lang="ts">
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import { CHAR_OPTIONS_DIGITS, CHAR_OPTIONS_LOWERCASE } from '$lib/client/constants/labels';
	import { capitalize } from '$lib/shared/helpers/util';

	type Props = {
		labelType: 'tag' | 'artist';
	};

	let { labelType }: Props = $props();
</script>

<svelte:head>
	<title>Find {labelType}s</title>
	<meta property="og:title" content="Find {capitalize(labelType)}s on Dexbooru" />
	<meta
		property="og:description"
		content="Explore tags from {CHAR_OPTIONS_LOWERCASE[0]} to {CHAR_OPTIONS_LOWERCASE[
			CHAR_OPTIONS_LOWERCASE.length - 1
		]} and {CHAR_OPTIONS_DIGITS[0]} to {CHAR_OPTIONS_DIGITS[
			CHAR_OPTIONS_DIGITS.length - 1
		]} on Dexbooru. Select the {labelType}s you're interested in or discover new ones."
	/>
	<meta property="og:image" content={ApplicationLogo} />
</svelte:head>
