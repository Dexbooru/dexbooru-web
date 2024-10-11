<script lang="ts">
	import { userPreferenceStore } from '$lib/client/stores/users';
	import { Alert, Button, Card, Label, Textarea } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';

	export let error: string | null = null;
	export let errorType: string | null = null;

	let customSiteCss: string = '';

	const userPreferenceUnsubscribe = userPreferenceStore.subscribe((data) => {
        customSiteCss = data.customSideWideCss;
	});

	onDestroy(() => {
		userPreferenceUnsubscribe();
	});
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">Interface</h3>
	<form method="POST" action="?/userInterfacePreferences" class="flex flex-col space-y-4">
		<Label class="space-y-2 mb-3">
			<span>Custom Site-wide CSS</span>
			<Textarea
				bind:value={customSiteCss}
				rows="4"
				name="customSiteWideCss"
				placeholder="Enter your CSS here"
			/>
			<p class="text-sm text-gray-500">
				Your CSS will be applied after each page on Dexbooru is fully loaded
			</p>
		</Label>

		<Button type="submit" color="primary">Save Interface Preferences</Button>

		{#if error !== null && errorType === 'preferences'}
			<Alert dismissable border color="red" class="mt-2">
				<span class="font-medium">Preferences save error!</span>
				{error}
			</Alert>
		{/if}
	</form>
</Card>
