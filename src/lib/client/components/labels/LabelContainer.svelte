<script lang="ts">
	import { Badge } from 'flowbite-svelte';

	export let labels: string[] | { name: string }[] = [];
	export let labelType: 'tag' | 'artist';
	export let labelsAreLarge: boolean = false;
	export let labelColor:
		| 'none'
		| 'red'
		| 'yellow'
		| 'green'
		| 'indigo'
		| 'purple'
		| 'pink'
		| 'blue'
		| 'dark'
		| 'primary'
		| undefined = 'red';
</script>

<div class="flex flex-wrap">
	{#each labels as label}
		<Badge
			href="/posts/{labelType}/{typeof label === 'object' ? label.name : label}"
			large={labelsAreLarge}
			class="ml-1 mr-1 mb-1"
			rounded
			color={labelColor}>{typeof label === 'object' ? label.name : label}</Badge
		>
	{/each}
</div>
