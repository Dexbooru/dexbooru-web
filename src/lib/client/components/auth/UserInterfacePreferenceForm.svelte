<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getAuthenticatedUser,
		getAuthenticatedUserPreferences,
	} from '$lib/client/helpers/context';
	import { applyCustomSiteWideCss } from '$lib/client/helpers/dom';
	import { MAXIMUM_SITE_WIDE_CSS_LENGTH } from '$lib/shared/constants/preferences';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Checkbox from 'flowbite-svelte/Checkbox.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';
	import { onMount } from 'svelte';

	let interfacePreferenceChanging: boolean = $state(false);
	let customSiteCss: string = $state('');
	let hidePostMetadataOnPreview: boolean = $state(false);
	let hideCollectionMetadataOnPreview: boolean = $state(false);

	const user = getAuthenticatedUser();
	const userPreferences = getAuthenticatedUserPreferences();
	const userPreferenceUnsubscribe = userPreferences.subscribe((data) => {
		customSiteCss = data.customSideWideCss;
		hidePostMetadataOnPreview = data.hidePostMetadataOnPreview;
		hideCollectionMetadataOnPreview = data.hideCollectionMetadataOnPreview;
	});

	onMount(() => {
		return () => {
			userPreferenceUnsubscribe();
		};
	});
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">Interface</h3>
	<form
		use:enhance={() => {
			interfacePreferenceChanging = true;
			return async ({ result }) => {
				interfacePreferenceChanging = false;
				if (result.type === 'success') {
					toast.push(
						'The user interface preferences were updated successfully!',
						SUCCESS_TOAST_OPTIONS,
					);

					userPreferences.update((currentPreferences) => {
						if (result.data) {
							const updatedPreferences = { ...currentPreferences, ...(result.data.data as object) };
							applyCustomSiteWideCss($user as TUser, updatedPreferences);
							return updatedPreferences;
						}

						return currentPreferences;
					});
				} else {
					toast.push(
						'An error occured while trying to change the user interface preferences',
						FAILURE_TOAST_OPTIONS,
					);
				}
			};
		}}
		method="POST"
		action="?/userInterfacePreferences"
		class="flex flex-col space-y-4"
	>
		<Label class="space-y-2 mb-3">
			<span>Custom Site-wide CSS (max of {MAXIMUM_SITE_WIDE_CSS_LENGTH} characters)</span>
			<Textarea
				maxlength={MAXIMUM_SITE_WIDE_CSS_LENGTH}
				bind:value={customSiteCss}
				rows="8"
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
				Collection titles, descriptions, uploaders and other visible information will not be shown.
				The images will be shown still.
			</p>
		</Label>

		<Button disabled={interfacePreferenceChanging} type="submit" color="primary"
			>Save Interface Preferences</Button
		>
	</form>
</Card>
