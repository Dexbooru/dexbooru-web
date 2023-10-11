<script lang="ts">
	import { Footer, FooterCopyright, FooterLinkGroup, FooterLink } from 'flowbite-svelte';
	import { GithubSolid } from 'flowbite-svelte-icons';

	const currentDate = new Date(Date.now());
	const currentYear = currentDate.getFullYear();
</script>

<Footer class="absolute bottom-0 left-0 z-20 w-full">
	<FooterCopyright href="/" by="Dexbooru" year={currentYear} />
	<FooterLinkGroup
		ulClass="flex flex-wrap items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0"
	>
		<FooterLink href="https://github.com/t-shah02/dexbooru-rewrite" target="_blank">
			<GithubSolid />
		</FooterLink>
	</FooterLinkGroup>
</Footer>
