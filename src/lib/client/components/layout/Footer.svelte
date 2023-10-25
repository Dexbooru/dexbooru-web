<script lang="ts">
	import { Footer, FooterCopyright, FooterLinkGroup, FooterLink } from 'flowbite-svelte';
	import { GithubSolid } from 'flowbite-svelte-icons';

	const currentDate = new Date(Date.now());
	const currentYear = currentDate.getFullYear();
</script>

<Footer class="sticky bottom-0 z-50 w-full bg-white dark:bg-gray-900 rounded-none">
	<FooterCopyright href="/" by="Dexbooru" year={currentYear} />
	<FooterLinkGroup
		ulClass="flex flex-wrap items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0"
	>
		<FooterLink href="https://github.com/t-shah02/dexbooru-rewrite" target="_blank">
			<GithubSolid />
		</FooterLink>
	</FooterLinkGroup>
</Footer>
