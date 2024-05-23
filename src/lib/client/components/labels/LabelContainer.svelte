<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import { CloseCircleSolid } from 'flowbite-svelte-icons';
	import type { ComponentProps } from 'svelte';

	export let labels: string[] | { name: string }[] = [];
	export let labelType: 'tag' | 'artist';
	export let labelsAreLarge: boolean = false;
	export let labelColor: ComponentProps<Badge>['color'] = 'red';
	export let labelIsLink: boolean = true;
	export let labelIsDismissable: boolean = false;
	export let handleLabelClose: ((event: Event) => void) | null = null;

	let processedLabels: string[] = [];

	$: {
		processedLabels = labels.map((label) => (typeof label === 'object' ? label.name : label));
	}
</script>

<div class="flex flex-wrap">
	{#each processedLabels as label (label)}
		<Badge
			dismissable={labelIsDismissable}
			href={labelIsLink ? `/posts/${labelType}/${label}` : undefined}
			large={labelsAreLarge}
			class="ml-1 mr-1 mb-1"
			rounded
			color={labelColor}
			>{label}
			<button
				slot="close-button"
				let:close
				on:click={handleLabelClose}
				type="button"
				class="inline-flex items-center rounded-full p-0.5 my-0.5 ms-1.5 -me-1.5 text-sm"
				aria-label="Remove"
			>
				<CloseCircleSolid class="h-4 w-4" />
				<span class="sr-only">Remove {labelType} called {label}</span>
			</button></Badge
		>
	{/each}
</div>
