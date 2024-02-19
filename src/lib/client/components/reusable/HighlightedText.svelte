<script lang="ts">
	import { getQueryParts } from '$lib/client/helpers/search';
	import { normalizeQuery } from '$lib/shared/helpers/search';

	export let query: string;
	export let fullText: string;

	const fullTextParts = getQueryParts(normalizeQuery(fullText), normalizeQuery(query));
</script>

<p>
	{#each fullTextParts as { text, type }}
		<span class={type === 'highlight' ? 'bg-yellow-400' : ''}>{text}</span>
	{/each}
</p>
