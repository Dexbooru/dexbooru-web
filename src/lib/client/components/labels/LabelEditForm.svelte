<script lang="ts">
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
	import type { Artist, Tag } from '@prisma/client';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Input, Label, Textarea } from 'flowbite-svelte';
	import { PlusSolid, TrashBinSolid } from 'flowbite-svelte-icons';

	type Props = {
		labelType: 'tag' | 'artist' | undefined;
		metadata: (Tag & Artist) | undefined;
		updateMetadata: (metadata: Tag & Artist) => void;
	};

	let { labelType, metadata, updateMetadata }: Props = $props();

	let labelEditing = $state(false);
	let description = $state(metadata?.description ?? '');
	let socialMediaLinks = $state<string[]>([...(metadata?.socialMediaLinks ?? [])]);
	let labelEditButtonDisabled = $derived.by(() => {
		if (labelType === 'tag') {
			return description.length > MAXIMUM_TAG_DESCRIPTION_LENGTH;
		}
		return !(
			socialMediaLinks.length <= MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH &&
			socialMediaLinks.every(
				(socialMediaLink) =>
					URL_REGEX.test(socialMediaLink) &&
					socialMediaLink.length > 0 &&
					socialMediaLink.length <= MAXIMUM_ARTIST_SOCIAL_MEDIA_LENGTH,
			)
		);
	});

	const user = getAuthenticatedUser();

	const handleSocialMediaInput = (event: Event, index: number) => {
		const target = event.target as HTMLInputElement;
		const socialMediaLink = target.value.toLocaleLowerCase().trim();
		if (socialMediaLink.length === 0 || socialMediaLinks.includes(socialMediaLink)) return;
		socialMediaLinks[index] = socialMediaLink;
	};

	const editLabel = async () => {
		if (!$user) return;

		labelEditing = true;

		const response = await updateLabelMetadata(labelType!, metadata!.name, {
			description,
			socialMediaLinks,
		});
		if (response.ok) {
			const responseData: TApiResponse<Tag & Artist> = await response.json();
			description = responseData.data.description ?? '';
			socialMediaLinks = responseData.data.socialMediaLinks;
			updateMetadata(responseData.data);

			toast.push(`The ${labelType} metadata has been updated successfully`, SUCCESS_TOAST_OPTIONS);
		} else {
			toast.push(
				`An unexpected error occured while updating the ${labelType} metadata`,
				FAILURE_TOAST_OPTIONS,
			);
		}

		labelEditing = false;
	};
</script>

{#if $user === null}
	<p class=" text-red-500">You must be logged in to edit the metadata of a label.</p>
{:else}
	<div class="flex flex-col">
		{#if labelType === 'tag'}
			<Label class="space-y-2 mb-3">
				<span>Description:</span>
				<Textarea
					bind:value={description}
					maxlength={MAXIMUM_TAG_DESCRIPTION_LENGTH}
					rows="3"
					name="tag-description"
					placeholder="Enter a tag description here"
				/>
			</Label>
		{:else}
			<Label class="space-y-2 mb-3">
				<span>Description:</span>
				<Textarea
					bind:value={description}
					maxlength={MAXIMUM_ARTIST_DESCRIPTION_LENGTH}
					rows="3"
					name="artist-description"
					placeholder="Enter a artist description here"
				/>
			</Label>
			<Label class="space-y-2 mb-3">
				<div class="flex justify-between !items-center">
					<span>Social media links:</span>
					<Button
						disabled={socialMediaLinks.length === MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH}
						on:click={() => socialMediaLinks.push('')}
						color="blue"
						size="xs"
					>
						<PlusSolid />
					</Button>
				</div>

				<ul class="!mt-5 block space-y-3">
					{#each socialMediaLinks as link, index}
						<li>
							<div class="flex space-x-3">
								<Input
									maxlength={MAXIMUM_ARTIST_SOCIAL_MEDIA_LENGTH}
									value={link}
									on:input={(event) => handleSocialMediaInput(event, index)}
									type="url"
									name="social-media-link-{index}"
									placeholder="Enter a social media link here"
								/>
								<Button on:click={() => socialMediaLinks.splice(index, 1)} color="red" size="xs">
									<TrashBinSolid />
								</Button>
							</div>
						</li>
					{/each}
				</ul>
			</Label>
		{/if}

		<Button on:click={editLabel} disabled={labelEditing || labelEditButtonDisabled}>
			Edit {labelType}
		</Button>
	</div>
{/if}
