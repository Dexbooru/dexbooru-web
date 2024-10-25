<script lang="ts">
	import { CloseButton, Drawer } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { sineIn } from 'svelte/easing';
	import CollectionCreateForm from './CollectionCreateForm.svelte';

	interface Props {
		isHidden: boolean;
	}

	let { isHidden = $bindable() }: Props = $props();
</script>

<Drawer
	transitionType="fly"
	transitionParams={{
		x: -320,
		duration: 200,
		easing: sineIn,
	}}
	id="post-collection-creation-sidebar"
	class="w-1/3 cursor-default"
	bind:hidden={isHidden}
	activateClickOutside
>
	<div class="flex items-center">
		<h5
			id="drawer-label"
			class="inline-flex items-center mb-6 text-base font-semibold text-gray-500 uppercase dark:text-gray-400"
		>
			<InfoCircleSolid class="w-5 h-5 me-2.5" />New collection
		</h5>
		<CloseButton on:click={() => (isHidden = true)} class="mb-4 dark:text-white" />
	</div>

	<CollectionCreateForm />
</Drawer>
