<script lang="ts">
	import Footer from 'flowbite-svelte/Footer.svelte';
	import FooterLink from 'flowbite-svelte/FooterLink.svelte';
	import FooterLinkGroup from 'flowbite-svelte/FooterLinkGroup.svelte';
	import FooterCopyright from 'flowbite-svelte/FooterCopyright.svelte';
	import GithubSolid from 'flowbite-svelte-icons/GithubSolid.svelte';	

	const currentDate = new Date(Date.now());
	const currentYear = currentDate.getFullYear();
</script>

<Footer
	id="app-footer"
	class="sticky flex justify-center space-x-5 h-14 bottom-0 z-50 w-full bg-white dark:bg-gray-900 rounded-none"
>
	<FooterLinkGroup
		ulClass="flex flex-wrap space-x-3 items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0"
	>
		<FooterCopyright id="footer-copyright" href="/" by="Dexbooru" year={currentYear} />

		<FooterLink href="https://github.com/Dexbooru/dexbooru-web" target="_blank">
			<GithubSolid />
		</FooterLink>
	</FooterLinkGroup>
</Footer>
