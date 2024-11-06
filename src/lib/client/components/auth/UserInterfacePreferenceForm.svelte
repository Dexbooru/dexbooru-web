<script lang="ts">
	import { getAuthenticatedUserPreferences } from '$lib/client/helpers/context';
	import { Alert, Button, Card, Checkbox, Label, Textarea } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';

	interface Props {
		error?: string | null;
		errorType?: string | null;
	}

	let { error = null, errorType = null }: Props = $props();

	let customSiteCss: string = $state('');
	let hidePostMetadataOnPreview: boolean = $state(false);
	let hideCollectionMetadataOnPreview: boolean = $state(false);

	const userPreferences = getAuthenticatedUserPreferences();
	const userPreferenceUnsubscribe = userPreferences.subscribe((data) => {
		customSiteCss = data.customSideWideCss;
		hidePostMetadataOnPreview = data.hidePostMetadataOnPreview;
		hideCollectionMetadataOnPreview = data.hideCollectionMetadataOnPreview;
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
		<Label class="space-y-2 mb-3">
			<span>Hide post metadata on your preview</span>
			<Checkbox bind:checked={hidePostMetadataOnPreview} />
			<input name="hidePostMetadataOnPreview" type="hidden" value={hidePostMetadataOnPreview} />
			<p class="text-sm text-gray-500">
				Post tags, artists, uploader and other visible information will not be shown. The images
				will be shown still.
			</p>
			<p class="text-sm text-gray-500">
				The post actions (ex: like, edit, report, etc) will still be available on the specific post
				view page. <br />They will be visible on the cards in your uploaded posts always for ease of
				accessibility.
			</p>
		</Label>
		<Label class="space-y-2 mb-3">
			<span>Hide collection metadata on your preview</span>
			<Checkbox bind:checked={hideCollectionMetadataOnPreview} />
			<input
				name="hideCollectionMetadataOnPreview"
				type="hidden"
				value={hideCollectionMetadataOnPreview}
			/>
			<p class="text-sm text-gray-500">
				Collection titles, descriptios, uploaders and other visible information will not be shown.
				The images will be shown still.
			</p>
			<p class="text-sm text-gray-500">
				The collection actions (ex: edit, delete, etc) will still be available on the specific
				collection view page. <br />They will be visible on the cards in your created collections
				always for ease of accessibility.
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
