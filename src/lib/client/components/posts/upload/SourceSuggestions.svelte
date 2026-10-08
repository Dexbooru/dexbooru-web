<script lang="ts">
	import { fetchSourceSuggestions } from '$lib/client/api/posts';
	import { getApplicationConfiguration } from '$lib/client/helpers/context';
	import { isAbortError } from '$lib/shared/helpers/async';
	import { isLabelAppropriate, transformLabel } from '$lib/shared/helpers/labels';
	import { pickSauceNaoPostSource } from '$lib/shared/helpers/sauceNao';
	import type { TPostSourceFields, TSauceNaoImageSuggestions } from '$lib/shared/types/sauceNao';
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
		artists: string[];
		sourceLink: string;
		characterName: string;
		sourceTitle: string;
		detectedSource: TPostSourceFields | null;
	};

	let {
		images,
		artists = $bindable(),
		sourceLink = $bindable(),
		characterName = $bindable(),
		sourceTitle = $bindable(),
		detectedSource = $bindable(),
	}: Props = $props();

	const applicationConfiguration = getApplicationConfiguration();
	const maxArtists = $derived($applicationConfiguration.maximumArtistsPerPost);

	let suggestionsByImageId = $state<Record<string, TImageSuggestionState>>({});
	const requests = new SvelteMap<string, AbortController>();

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

	const detectedFromImages = $derived.by(() => {
		for (const image of images) {
			const state = suggestionsByImageId[image.id];
			if (state?.status !== 'ok') continue;
			const picked = pickSauceNaoPostSource(state.suggestions.matches);
			if (picked) return picked;
		}
		return null;
	});

	$effect(() => {
		if (detectedSource === detectedFromImages) return;
		detectedSource = detectedFromImages;
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

	const urlParts = (url: string) => {
		try {
			const parsed = new URL(url);
			const path = `${parsed.pathname}${parsed.search}`;
			return { host: parsed.hostname.replace(/^www\./, ''), path: path === '/' ? '' : path };
		} catch {
			return { host: url, path: '' };
		}
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

{#snippet favicon(host: string)}
	<img
		src="https://www.google.com/s2/favicons?domain={encodeURIComponent(host)}&sz=32"
		alt=""
		loading="lazy"
		class="h-4 w-4 shrink-0 rounded-sm"
		onerror={(event) => event.currentTarget.classList.add('invisible')}
	/>
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
								{@const characterLabels = suggestionLabels(state.suggestions.characters, 'tag')}
								{@const seriesLabels = suggestionLabels(state.suggestions.series, 'tag')}
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
										{@render labelChips(
											characterLabels,
											characterName ? [characterName] : [],
											'red',
											false,
											(label) => (characterName = label),
										)}
									</div>
								{/if}
								{#if seriesLabels.length > 0}
									<div>
										<p class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Series</p>
										{@render labelChips(
											seriesLabels,
											sourceTitle ? [sourceTitle] : [],
											'red',
											false,
											(label) => (sourceTitle = label),
										)}
									</div>
								{/if}
								{#if sourceUrls.length > 0}
									<div>
										<p class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Sources</p>
										<ul
											class="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900"
										>
											{#each sourceUrls as url (url)}
												{@const parts = urlParts(url)}
												<li class="flex items-center gap-3 px-3 py-2">
													{@render favicon(parts.host)}
													<a
														href={url}
														target="_blank"
														rel="noopener noreferrer"
														title={url}
														class="min-w-0 flex-1 truncate text-sm"
													>
														<span
															class="text-primary-600 dark:text-primary-500 font-medium hover:underline"
															>{parts.host}</span
														>
														<span class="text-gray-500 dark:text-gray-400">{parts.path}</span>
													</a>
													{#if sourceLink === url}
														<Badge color="green" rounded class="shrink-0">Current source</Badge>
													{:else}
														<Button
															type="button"
															size="xs"
															color="alternative"
															class="shrink-0"
															onclick={() => (sourceLink = url)}
														>
															Use as source
														</Button>
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
								{#if state.suggestions.matches.length === 0}
									<p class="text-sm text-gray-500 dark:text-gray-400">No sources found.</p>
								{:else}
									<ul class="space-y-2">
										{#each state.suggestions.matches.slice(0, TOP_MATCH_COUNT) as match, matchIndex (`${match.indexId}-${matchIndex}`)}
											<li class="flex items-center gap-2">
												{#if match.thumbnailUrl}
													<img
														src={match.thumbnailUrl}
														alt=""
														class="h-12 w-12 shrink-0 rounded object-cover"
													/>
												{:else}
													<div
														class="h-12 w-12 shrink-0 rounded bg-gray-100 dark:bg-gray-700"
													></div>
												{/if}
												<div class="min-w-0 text-sm">
													{#if match.sourceUrls[0]}
														<a
															href={match.sourceUrls[0]}
															target="_blank"
															rel="noopener noreferrer"
															class="text-primary-600 dark:text-primary-500 inline-flex items-center gap-1.5 font-medium hover:underline"
														>
															{@render favicon(urlParts(match.sourceUrls[0]).host)}
															{match.indexName}
														</a>
													{:else}
														<span class="font-medium text-gray-900 dark:text-white"
															>{match.indexName}</span
														>
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
