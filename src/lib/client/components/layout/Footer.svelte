<script lang="ts">
	import { Footer, FooterCopyright, FooterLink, FooterLinkGroup } from 'flowbite-svelte';
	import { DiscordSolid, GithubSolid } from 'flowbite-svelte-icons';

	const currentDate = new Date(Date.now());
	const currentYear = currentDate.getFullYear();
</script>

<Footer
	class="sticky flex justify-center space-x-5 h-14 bottom-0 z-50 w-full bg-white dark:bg-gray-900 rounded-none"
>
	<FooterLinkGroup
		ulClass="flex flex-wrap space-x-3 items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0"
	>
		<FooterCopyright id="footer-copyright" href="/" by="Dexbooru" year={currentYear} />

		<FooterLink href="https://github.com/t-shah02/dexbooru-rewrite" target="_blank">
			<GithubSolid />
		</FooterLink>
		<FooterLink href="https://discord.com" target="_blank">
			<DiscordSolid />
		</FooterLink>
	</FooterLinkGroup>
</Footer>
