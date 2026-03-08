<script lang="ts">
	import type { Artist, Tag } from '$generated/prisma/browser';
	import { updateLabelMetadata } from '$lib/client/api/labels';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUser } from '$lib/client/helpers/context';
	import {
		MAXIMUM_ARTIST_DESCRIPTION_LENGTH,
		MAXIMUM_ARTIST_SOCIAL_MEDIA_LENGTH,
		MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH,
		MAXIMUM_TAG_DESCRIPTION_LENGTH,
	} from '$lib/shared/constants/labels';
	import { URL_REGEX } from '$lib/shared/constants/urls';
	import type { TApiResponse } from '$lib/shared/types/api';
	import { toast } from '@zerodevx/svelte-toast';
	import PlusOutline from 'flowbite-svelte-icons/PlusOutline.svelte';
	import TrashBinSolid from 'flowbite-svelte-icons/TrashBinSolid.svelte';
	import UndoOutline from 'flowbite-svelte-icons/UndoOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Helper from 'flowbite-svelte/Helper.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';

	type Props = {
		labelType: 'tag' | 'artist' | undefined;
		metadata: (Tag & Artist) | undefined;
		updateMetadata: (_metadata: Tag & Artist) => void;
	};

	let { labelType, metadata, updateMetadata }: Props = $props();

	let labelEditing = $state(false);
	let description = $state('');
	let socialMediaLinks = $state<{ id: string; url: string }[]>([]);

	const user = getAuthenticatedUser();

	const resetForm = () => {
		description = metadata?.description ?? '';
		socialMediaLinks = (metadata?.socialMediaLinks ?? []).map((url) => ({
			id: crypto.randomUUID(),
			url,
		}));
	};

	$effect(() => {
		resetForm();
	});

	let isDirty = $derived.by(() => {
		const descriptionChanged = description !== (metadata?.description ?? '');
		const originalLinks = metadata?.socialMediaLinks ?? [];
		const currentUrls = socialMediaLinks.map((l) => l.url);

		const linksChanged =
			currentUrls.length !== originalLinks.length ||
			currentUrls.some((url, i) => url !== originalLinks[i]);

		return descriptionChanged || (labelType === 'artist' && linksChanged);
	});

	let labelEditButtonDisabled = $derived.by(() => {
		if (!isDirty) return true;
		if (labelType === 'tag') return description.length > MAXIMUM_TAG_DESCRIPTION_LENGTH;

		return (
			socialMediaLinks.length > MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH ||
			!socialMediaLinks.every(
				(link) =>
					URL_REGEX.test(link.url) &&
					link.url.length > 0 &&
					link.url.length <= MAXIMUM_ARTIST_SOCIAL_MEDIA_LENGTH,
			)
		);
	});

	const editLabel = async () => {
		if (!$user || !labelType || !metadata) return;
		labelEditing = true;

		const response = await updateLabelMetadata(labelType, metadata.name, {
			description,
			socialMediaLinks: socialMediaLinks.map((l) => l.url.trim().toLowerCase()),
		});

		if (response.ok) {
			const responseData: TApiResponse<Tag & Artist> = await response.json();
			updateMetadata(responseData.data);
			toast.push(`The ${labelType} metadata has been updated successfully`, SUCCESS_TOAST_OPTIONS);
		} else {
			toast.push(`An error occurred updating ${labelType} metadata`, FAILURE_TOAST_OPTIONS);
		}
		labelEditing = false;
	};
</script>

{#if $user === null}
	<p class="text-sm font-medium text-red-500">You must be logged in to edit metadata.</p>
{:else}
	<div class="flex flex-col gap-4">
		<Label class="space-y-2">
			<span>Description:</span>
			<Textarea
				class="w-full"
				bind:value={description}
				maxlength={labelType === 'tag'
					? MAXIMUM_TAG_DESCRIPTION_LENGTH
					: MAXIMUM_ARTIST_DESCRIPTION_LENGTH}
				rows={3}
				placeholder="Enter a description..."
			/>
		</Label>

		{#if labelType === 'artist'}
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium">Social Media Links:</span>
					<Button
						disabled={socialMediaLinks.length >= MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH}
						onclick={() => socialMediaLinks.push({ id: crypto.randomUUID(), url: '' })}
						color="blue"
						pill
						size="xs"
					>
						<PlusOutline class="h-4 w-4" />
					</Button>
				</div>

				<ul class="space-y-2">
					{#each socialMediaLinks as link (link.id)}
						{@const isValid = link.url === '' || URL_REGEX.test(link.url)}
						<li class="flex flex-col gap-1">
							<div class="flex gap-2">
								<Input
									class="flex-1"
									bind:value={link.url}
									color={isValid ? 'default' : 'red'}
									maxlength={MAXIMUM_ARTIST_SOCIAL_MEDIA_LENGTH}
									type="url"
									placeholder="https://..."
								/>
								<Button
									onclick={() =>
										(socialMediaLinks = socialMediaLinks.filter((l) => l.id !== link.id))}
									color="red"
									size="xs"
								>
									<TrashBinSolid class="h-4 w-4" />
								</Button>
							</div>
							{#if !isValid}
								<Helper class="mt-1" color="red">Please enter a valid URL.</Helper>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="flex gap-2 pt-2">
			<Button class="flex-1" onclick={editLabel} disabled={labelEditing || labelEditButtonDisabled}>
				Save {labelType}
			</Button>
			<Button outline color="alternative" onclick={resetForm} disabled={labelEditing || !isDirty}>
				<UndoOutline class="mr-2 h-4 w-4" /> Reset
			</Button>
		</div>
	</div>
{/if}
