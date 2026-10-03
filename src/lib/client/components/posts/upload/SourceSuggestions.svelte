<script lang="ts">
	import { fetchSourceSuggestions } from '$lib/client/api/posts';
	import { getApplicationConfiguration } from '$lib/client/helpers/context';
	import { isLabelAppropriate, transformLabel } from '$lib/shared/helpers/labels';
	import type { TSauceNaoImageSuggestions } from '$lib/shared/types/sauceNao';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import { onDestroy, untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	const TOP_MATCH_COUNT = 3;
	const TOP_SOURCE_COUNT = 5;

	type TUploadImage = {
		id: string;
		file: File;
		imageBase64: string;
	};

	type TImageSuggestionState =
		| { status: 'loading' }
		| { status: 'ok'; suggestions: TSauceNaoImageSuggestions }
		| { status: 'disabled' }
		| { status: 'rate_limited' }
		| { status: 'error' };

	type Props = {
		images: TUploadImage[];
		tags: string[];
		artists: string[];
		sourceLink: string;
	};

	let {
		images,
		tags = $bindable(),
		artists = $bindable(),
		sourceLink = $bindable(),
	}: Props = $props();

	const applicationConfiguration = getApplicationConfiguration();
	const maxArtists = $derived($applicationConfiguration.maximumArtistsPerPost);
	const maxTags = $derived($applicationConfiguration.maximumTagsPerPost);

	let suggestionsByImageId = $state<Record<string, TImageSuggestionState>>({});
	const requests = new SvelteMap<string, AbortController>();

	const isAbortError = (error: unknown) =>
		(error instanceof DOMException || error instanceof Error) && error.name === 'AbortError';

	const forgetImage = (id: string) => {
		requests.get(id)?.abort();
		requests.delete(id);
		if (!(id in suggestionsByImageId)) return;
		const remaining: Record<string, TImageSuggestionState> = {};
		for (const [key, value] of Object.entries(suggestionsByImageId)) {
			if (key !== id) remaining[key] = value;
		}
		suggestionsByImageId = remaining;
	};

	const stateFromResponse = (
		response: Awaited<ReturnType<typeof fetchSourceSuggestions>>,
	): TImageSuggestionState => {
		switch (response.status) {
			case 'ok':
				return { status: 'ok', suggestions: response.suggestions };
			case 'disabled':
				return { status: 'disabled' };
			case 'rate_limited':
				return { status: 'rate_limited' };
			default: {
				const unexpected: never = response;
				return unexpected;
			}
		}
	};

	const startRequest = (image: TUploadImage) => {
		const controller = new AbortController();
		requests.set(image.id, controller);
		suggestionsByImageId[image.id] = { status: 'loading' };
		void fetchSourceSuggestions(image.file, { signal: controller.signal })
			.then((response) => {
				if (requests.get(image.id) !== controller) return;
				suggestionsByImageId[image.id] = stateFromResponse(response);
			})
			.catch((error: unknown) => {
				if (requests.get(image.id) !== controller || isAbortError(error)) return;
				suggestionsByImageId[image.id] = { status: 'error' };
			});
	};

	// The result map is written here. Tracking it would schedule this effect again when a response lands.
	$effect(() => {
		const currentImages = images;
		untrack(() => {
			const ids = new Set(currentImages.map((image) => image.id));
			for (const id of Object.keys(suggestionsByImageId)) {
				if (!ids.has(id)) forgetImage(id);
			}
			for (const image of currentImages) {
				if (suggestionsByImageId[image.id]) continue;
				startRequest(image);
			}
		});
	});

	onDestroy(() => {
		for (const controller of requests.values()) controller.abort();
		requests.clear();
	});

	const showSuggestions = $derived.by(() => {
		if (images.length === 0) return false;
		const states = images
			.map((image) => suggestionsByImageId[image.id])
			.filter((state) => state !== undefined);
		const resolved = states.filter((state) => state.status !== 'loading');
		if (resolved.length > 0 && resolved.every((state) => state.status === 'disabled')) return false;
		return states.some((state) => state.status !== 'disabled');
	});

	const suggestionLabels = (names: string[], labelType: 'artist' | 'tag') => {
		const labels: string[] = [];
		for (const name of names) {
			const label = transformLabel(name);
			if (labels.includes(label) || !isLabelAppropriate(label, labelType)) continue;
			labels.push(label);
		}
		return labels;
	};

	const visibleLabels = (
		names: string[],
		labelType: 'artist' | 'tag',
		current: string[],
		max: number,
	) =>
		suggestionLabels(names, labelType).filter(
			(label) => current.includes(label) || current.length < max,
		);

	const addArtist = (label: string) => {
		if (artists.includes(label) || artists.length >= maxArtists) return;
		artists = [...artists, label];
	};

	const addTag = (label: string) => {
		if (tags.includes(label) || tags.length >= maxTags) return;
		tags = [...tags, label];
	};

	const formatSimilarity = (similarity: number) =>
		Number.isInteger(similarity) ? `${similarity}%` : `${similarity.toFixed(1)}%`;
</script>

{#snippet labelChips(
	labels: string[],
	applied: string[],
	color: 'green' | 'red',
	prominent: boolean,
	onAdd: (label: string) => void,
)}
	<div class="flex flex-wrap gap-1">
		{#each labels as label (label)}
			{#if applied.includes(label)}
				<Badge {color} large={prominent} rounded>{label}</Badge>
			{:else}
				<Button type="button" size={prominent ? 'sm' : 'xs'} {color} onclick={() => onAdd(label)}>
					{label}
				</Button>
			{/if}
		{/each}
	</div>
{/snippet}

{#if showSuggestions}
	<div class="!mt-5 space-y-3">
		<span class="font-semibold text-gray-800 dark:text-gray-300">Source suggestions</span>
		{#each images as image (image.id)}
			{@const state = suggestionsByImageId[image.id]}
			{#if state && state.status !== 'disabled'}
				<div
					class="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800"
				>
					<div class="flex gap-3">
						<img
							src={image.imageBase64}
							alt="Upload preview"
							class="h-16 w-16 shrink-0 rounded object-cover"
						/>
						<div class="min-w-0 flex-1 space-y-3">
							{#if state.status === 'loading'}
								<Spinner size="6" />
							{:else if state.status === 'rate_limited'}
								<p class="text-sm text-gray-600 dark:text-gray-300">
									SauceNAO rate limit reached, try again later.
								</p>
							{:else if state.status === 'error'}
								<p class="text-sm text-gray-500 dark:text-gray-400">Source lookup failed.</p>
							{:else if state.status === 'ok'}
								{@const artistLabels = visibleLabels(
									state.suggestions.artists,
									'artist',
									artists,
									maxArtists,
								)}
								{@const characterLabels = visibleLabels(
									state.suggestions.characters,
									'tag',
									tags,
									maxTags,
								)}
								{@const seriesLabels = visibleLabels(
									state.suggestions.series,
									'tag',
									tags,
									maxTags,
								)}
								{@const sourceUrls = state.suggestions.sourceUrls.slice(0, TOP_SOURCE_COUNT)}
								{#if artistLabels.length > 0}
									<div class="rounded-md bg-green-50 p-2 dark:bg-green-900/20">
										<p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Artists</p>
										{@render labelChips(artistLabels, artists, 'green', true, addArtist)}
									</div>
								{/if}
								{#if characterLabels.length > 0}
									<div>
										<p class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
											Characters
										</p>
										{@render labelChips(characterLabels, tags, 'red', false, addTag)}
									</div>
								{/if}
								{#if seriesLabels.length > 0}
									<div>
										<p class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Series</p>
										{@render labelChips(seriesLabels, tags, 'red', false, addTag)}
									</div>
								{/if}
								{#if sourceUrls.length > 0}
									<div class="space-y-1">
										<p class="text-xs font-medium text-gray-700 dark:text-gray-300">Sources</p>
										{#each sourceUrls as url (url)}
											<div class="flex min-w-0 items-center gap-2">
												<span class="truncate text-xs text-gray-600 dark:text-gray-300">{url}</span>
												{#if sourceLink === url}
													<Badge color="blue" rounded class="shrink-0">Use as source</Badge>
												{:else}
													<Button
														type="button"
														size="xs"
														color="blue"
														class="shrink-0"
														onclick={() => (sourceLink = url)}
													>
														Use as source
													</Button>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
								{#if state.suggestions.matches.length === 0}
									<p class="text-sm text-gray-500 dark:text-gray-400">No sources found.</p>
								{:else}
									<ul class="space-y-2">
										{#each state.suggestions.matches.slice(0, TOP_MATCH_COUNT) as match, matchIndex (`${match.indexId}-${matchIndex}`)}
											<li class="flex items-center gap-2">
												<img
													src={match.thumbnailUrl}
													alt=""
													class="h-12 w-12 shrink-0 rounded object-cover"
												/>
												<div class="min-w-0 text-sm">
													{#if match.sourceUrls[0]}
														<a
															href={match.sourceUrls[0]}
															target="_blank"
															rel="noopener noreferrer"
															class="text-primary-700 dark:text-primary-400 hover:underline"
														>
															{match.indexName}
														</a>
													{:else}
														<span class="text-gray-900 dark:text-white">{match.indexName}</span>
													{/if}
													<p class="text-gray-600 tabular-nums dark:text-gray-300">
														{formatSimilarity(match.similarity)}
													</p>
												</div>
											</li>
										{/each}
									</ul>
								{/if}
							{/if}
						</div>
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/if}
