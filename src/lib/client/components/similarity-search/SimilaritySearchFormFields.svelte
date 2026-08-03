<script lang="ts">
	import type { TPostImageSimilarityConfiguration } from '$lib/client/types/postImageSimilarity';
	import { FILE_IMAGE_ACCEPT } from '$lib/shared/constants/images';
	import { MAXIMUM_POST_DESCRIPTION_LENGTH } from '$lib/shared/constants/posts';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import Fileupload from 'flowbite-svelte/Fileupload.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';

	type Props = {
		postId: string;
		imageUrl: string;
		imageFile: string;
		similarityDescription: string;
		similarityConfiguration: TPostImageSimilarityConfiguration | null;
		onImageFileChange: (event: Event) => void | Promise<void>;
	};

	let {
		postId = $bindable(),
		imageUrl = $bindable(),
		imageFile = $bindable(),
		similarityDescription = $bindable(),
		similarityConfiguration,
		onImageFileChange,
	}: Props = $props();

	const isAllImageDomainsAllowed = (configuration: TPostImageSimilarityConfiguration): boolean =>
		configuration.all_image_domains_allowed_in_search ||
		(configuration.allowed_image_domains.length === 1 &&
			configuration.allowed_image_domains[0] === '*');
</script>

<div class="space-y-6">
	<div class="space-y-1">
		<Label for="post-id-similarity-search" class="dark:text-gray-200">Post ID</Label>
		<Input
			name="postId"
			bind:value={postId}
			type="text"
			id="post-id-similarity-search"
			placeholder="Enter post UUID"
			size="md"
			class="w-full dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
		/>
	</div>

	<div class="space-y-1">
		<Label for="image-url-similarity-search" class="dark:text-gray-200">Image URL</Label>
		<Input
			name="imageUrl"
			bind:value={imageUrl}
			type="url"
			id="image-url-similarity-search"
			placeholder="https://…"
			size="md"
			class="w-full dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
		/>
		{#if similarityConfiguration}
			{#if isAllImageDomainsAllowed(similarityConfiguration)}
				<p class="text-xs text-gray-500 dark:text-gray-400">
					Image URLs from any domain are allowed for similarity search.
				</p>
			{:else if similarityConfiguration.allowed_image_domains.length > 0}
				<div class="space-y-1.5">
					<p class="text-xs text-gray-500 dark:text-gray-400">Allowed image URL domains:</p>
					<div class="flex flex-wrap gap-1.5">
						{#each similarityConfiguration.allowed_image_domains as domain (domain)}
							<a href="https://{domain}" target="_blank" rel="noopener noreferrer">
								<Badge color="blue" class="px-2 py-0.5">{domain}</Badge>
							</a>
						{/each}
					</div>
				</div>
			{:else}
				<p class="text-xs text-gray-500 dark:text-gray-400">
					No external image URL domains are currently allowed.
				</p>
			{/if}
		{/if}
	</div>

	<div class="space-y-1">
		<Label for="image-file-similarity" class="dark:text-gray-200">Upload image</Label>
		<Fileupload
			onchange={onImageFileChange}
			id="image-file-similarity"
			accept={FILE_IMAGE_ACCEPT.join(',')}
			class="w-full dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
		/>
		<Input name="imageFile" type="hidden" value={imageFile} />
	</div>

	<div class="space-y-1">
		<Label for="similarity-description" class="dark:text-gray-200">
			Optional description (for ML context)
		</Label>
		<Textarea
			id="similarity-description"
			name="similarityDescription"
			bind:value={similarityDescription}
			rows={3}
			maxlength={MAXIMUM_POST_DESCRIPTION_LENGTH}
			placeholder="Short text passed to the similarity model (optional)"
			class="w-full dark:bg-gray-700 dark:text-gray-200"
		/>
		<p class="text-right text-xs text-gray-500 dark:text-gray-400">
			{similarityDescription.length}/{MAXIMUM_POST_DESCRIPTION_LENGTH}
		</p>
	</div>
</div>
