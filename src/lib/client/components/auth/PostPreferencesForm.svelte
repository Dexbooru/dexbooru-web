<script lang="ts">
	import { userPreferenceStore } from '$lib/client/stores/users';
	import { Alert, Button, Card, Checkbox, Label, Textarea } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';

	export let error: string | null = null;
	export let errorType: string | null = null;

	let autoBlurNsfw: boolean = false;
	let browseInSafeMode: boolean = false;
	let blacklistedTags: string = '';
	let blacklistedArtists: string = '';

	const userPreferenceUnsubscribe = userPreferenceStore.subscribe((data) => {
		autoBlurNsfw = data.autoBlurNsfw;
		browseInSafeMode = data.browseInSafeMode;
		blacklistedTags = data.blacklistedTags.join('\n');
		blacklistedArtists = data.blacklistedArtists.join('\n');
	});

	onDestroy(() => {
		userPreferenceUnsubscribe();
	});
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">Posts</h3>
	<form method="POST" action="?/postPreferences" class="flex flex-col space-y-4">
		<Label class="space-y-2 mb-3">
			<span>Auto Blur NSFW Posts</span>
			<Checkbox bind:checked={autoBlurNsfw} />
			<input type="hidden" name="autoBlurNsfw" value={autoBlurNsfw} />
			<p class="text-sm text-gray-500">Removes the automatic blur on posts marked as NSFW</p>
		</Label>

		<Label class="space-y-2 mb-3">
			<span>Browse in Safe Mode</span>
			<Checkbox bind:checked={browseInSafeMode} />
			<p class="text-sm text-gray-500">Safe mode hides NSFW marked posts automatically</p>
			<input type="hidden" name="browseInSafeMode" value={browseInSafeMode} />
		</Label>

		<div class="flex flex-row flex-wrap">
			<Label class="space-y-2 mb-3">
				<span>Blacklisted Tags (One per line)</span>
				<Textarea
					bind:value={blacklistedTags}
					rows="4"
					name="blacklistedTags"
					placeholder="Enter one tag per line"
				/>
				<p class="text-sm text-gray-500">
					All posts with the provided blacklist of tags will not be displayed
				</p>
			</Label>

			<Label class="space-y-2 mb-3">
				<span>Blacklisted Artists (One per line)</span>
				<Textarea
					bind:value={blacklistedArtists}
					rows="4"
					name="blacklistedArtists"
					placeholder="Enter one artist per line"
				/>
				<p class="text-sm text-gray-500">
					All posts with the provided blacklist of artists will not be displayed
				</p>
			</Label>
		</div>

		<Button type="submit" color="primary">Save Post Preferences</Button>

		{#if error !== null && errorType === 'preferences'}
			<Alert dismissable border color="red" class="mt-2">
				<span class="font-medium">Preferences save error!</span>
				{error}
			</Alert>
		{/if}
	</form>
</Card>
