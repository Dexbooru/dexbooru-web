<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getAuthenticatedUser,
		getAuthenticatedUserPreferences,
	} from '$lib/client/helpers/context';
	import { applyCustomSiteWideCss } from '$lib/client/helpers/dom';
	import {
		MAXIMUM_BLACKLISTED_ARTISTS,
		MAXIMUM_BLACKLISTED_TAGS,
	} from '$lib/shared/constants/labels';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Checkbox from 'flowbite-svelte/Checkbox.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';
	import { onMount } from 'svelte';

	let preferencesChanging = $state(false);
	let autoBlurNsfw: boolean = $state(false);
	let browseInSafeMode: boolean = $state(false);
	let blacklistedTags: string = $state('');
	let blacklistedArtists: string = $state('');

	const user = getAuthenticatedUser();
	const userPreferences = getAuthenticatedUserPreferences();

	const userPreferenceUnsubscribe = userPreferences.subscribe((data) => {
		autoBlurNsfw = data.autoBlurNsfw;
		browseInSafeMode = data.browseInSafeMode;
		blacklistedTags = data.blacklistedTags.join('\n');
		blacklistedArtists = data.blacklistedArtists.join('\n');
	});

	onMount(() => {
		return () => {
			userPreferenceUnsubscribe();
		};
	});
</script>

<Card class="p-6 sm:p-8">
	<h3 class="mb-5 text-center text-xl font-medium text-gray-900 dark:text-white">Posts</h3>
	<form
		use:enhance={() => {
			preferencesChanging = true;
			return async ({ result }) => {
				preferencesChanging = false;
				if (result.type === 'success') {
					toast.push('The post preferences were updated successfully!', SUCCESS_TOAST_OPTIONS);
					userPreferences.update((currentPreferences) => {
						// @ts-expect-error: The type of result.data.data is unknown, but we know it will be a partial of the user preferences
						const updatedPreferences = { ...currentPreferences, ...result.data.data };
						applyCustomSiteWideCss($user as TUser, updatedPreferences);

						return updatedPreferences;
					});
				} else {
					toast.push(
						'An error occured while trying to change the post preferences',
						FAILURE_TOAST_OPTIONS,
					);
				}
			};
		}}
		method="POST"
		action="?/postPreferences"
		class="flex flex-col space-y-4"
	>
		<Label class="mb-3 space-y-2">
			<span>Auto Blur NSFW Posts</span>
			<Checkbox bind:checked={autoBlurNsfw} />
			<input type="hidden" name="autoBlurNsfw" value={autoBlurNsfw} />
			<p class="text-sm text-gray-500">Removes the automatic blur on posts marked as NSFW</p>
		</Label>

		<Label class="mb-3 space-y-2">
			<span>Browse in Safe Mode</span>
			<Checkbox bind:checked={browseInSafeMode} />
			<p class="text-sm text-gray-500">Safe mode hides NSFW marked posts automatically</p>
			<input type="hidden" name="browseInSafeMode" value={browseInSafeMode} />
		</Label>

		<div class="flex flex-row flex-wrap">
			<Label class="mb-3 space-y-2">
				<span>Blacklisted Tags (One per line with a max of {MAXIMUM_BLACKLISTED_TAGS})</span>
				<Textarea
					class="w-full"
					bind:value={blacklistedTags}
					rows={4}
					name="blacklistedTags"
					placeholder="Enter one tag per line"
				/>
				<p class="text-sm text-gray-500">
					All posts with the provided blacklist of tags will not be displayed
				</p>
			</Label>

			<Label class="mb-3 space-y-2">
				<span>Blacklisted Artists (One per line with a max of {MAXIMUM_BLACKLISTED_ARTISTS})</span>
				<Textarea
					class="w-full"
					bind:value={blacklistedArtists}
					rows={4}
					name="blacklistedArtists"
					placeholder="Enter one artist per line"
				/>
				<p class="text-sm text-gray-500">
					All posts with the provided blacklist of artists will not be displayed
				</p>
			</Label>
		</div>

		<Button disabled={preferencesChanging} type="submit" color="primary"
			>Save Post Preferences</Button
		>
	</form>
</Card>
