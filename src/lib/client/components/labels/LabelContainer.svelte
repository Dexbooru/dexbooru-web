<script lang="ts">
	import { Badge } from 'flowbite-svelte';

	export let labels: string[] | { name: string }[] = [];
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
	export let handleLabelClick: ((label: string) => void) | null = null;
</script>

<div class="flex flex-wrap">
	{#each labels as label}
		<button
			on:click={() => {
				handleLabelClick && handleLabelClick(typeof label === 'object' ? label.name : label);
			}}
		>
			<Badge
				large={labelsAreLarge}
				class="ml-1 mr-1 mb-1 {handleLabelClick && 'cursor-pointer'}"
				rounded
				color={labelColor}>{typeof label === 'object' ? label.name : label}</Badge
			>
		</button>
	{/each}
</div>
