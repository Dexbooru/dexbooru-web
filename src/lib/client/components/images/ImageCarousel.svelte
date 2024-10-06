<script lang="ts">
	import type { TCarouselTransitionFunction } from '$lib/client/types/images';
	import { Carousel } from 'flowbite-svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	export let postHref: string | null = null;
	export let imageUrls: string[];
	export let imagesAlt: string | null = null;
	export let slideDuration: number = 750;
	export let blurImages: boolean = false;
	export let transitionFunction: TCarouselTransitionFunction | null = null;

	const imagesData: HTMLImgAttributes[] = imageUrls.map((imageUrl, index) => {
		return {
			src: imageUrl,
			alt: imagesAlt ?? `image content id of ${crypto.randomUUID()} in carousel slide ${index + 1}`,
		};
	});
</script>

<Carousel
	let:Controls
	let:Indicators
	images={imagesData}
	{slideDuration}
	transition={transitionFunction}
>
	<a slot="slide" href={postHref} let:Slide let:index>
		<Slide
			class={`${blurImages && '!blur-md'} object-cover object-center`}
			image={imagesData[index]}
		/>
	</a>

	{#if imagesData.length > 1}
		<Controls />
		<Indicators />
	{/if}
</Carousel>
