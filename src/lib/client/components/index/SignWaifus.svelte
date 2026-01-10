<script lang="ts">
	import Waifu0 from '$lib/client/assets/signs/0.png';
	import Waifu1 from '$lib/client/assets/signs/1.png';
	import Waifu2 from '$lib/client/assets/signs/2.png';
	import Waifu3 from '$lib/client/assets/signs/3.png';
	import Waifu4 from '$lib/client/assets/signs/4.png';
	import Waifu5 from '$lib/client/assets/signs/5.png';
	import Waifu6 from '$lib/client/assets/signs/6.png';
	import Waifu7 from '$lib/client/assets/signs/7.png';
	import Waifu8 from '$lib/client/assets/signs/8.png';
	import Waifu9 from '$lib/client/assets/signs/9.png';

	type Props = {
		postCount: number;
	};

	let { postCount }: Props = $props();

	const renderedWaifus = postCount
		.toString()
		.split('')
		.map((digit) => {
			switch (digit) {
				case '0':
					return { src: Waifu0, alt: 'Waifu Sign 0' };
				case '1':
					return { src: Waifu1, alt: 'Waifu Sign 1' };
				case '2':
					return { src: Waifu2, alt: 'Waifu Sign 2' };
				case '3':
					return { src: Waifu3, alt: 'Waifu Sign 3' };
				case '4':
					return { src: Waifu4, alt: 'Waifu Sign 4' };
				case '5':
					return { src: Waifu5, alt: 'Waifu Sign 5' };
				case '6':
					return { src: Waifu6, alt: 'Waifu Sign 6' };
				case '7':
					return { src: Waifu7, alt: 'Waifu Sign 7' };
				case '8':
					return { src: Waifu8, alt: 'Waifu Sign 8' };
				case '9':
					return { src: Waifu9, alt: 'Waifu Sign 9' };
				default:
					return null;
			}
		})
		.filter((waifu) => waifu !== null);
</script>

<section class="flex mt-5">
	{#each renderedWaifus as waifu}
		<img src={waifu.src} alt={waifu.alt} class="w-8 h-8 md:w-12 md:h-12 lg:w-32 lg:h-32" />
	{/each}
</section>
