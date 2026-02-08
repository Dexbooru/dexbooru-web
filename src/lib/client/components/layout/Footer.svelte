<script lang="ts">
	import Footer from 'flowbite-svelte/Footer.svelte';
	import FooterCopyright from 'flowbite-svelte/FooterCopyright.svelte';
	import FooterLinkGroup from 'flowbite-svelte/FooterLinkGroup.svelte';
	import FooterIcon from 'flowbite-svelte/FooterIcon.svelte';
	import GithubSolid from 'flowbite-svelte-icons/GithubSolid.svelte';

	const currentDate = new Date(Date.now());
	const currentYear = currentDate.getFullYear();
</script>

<Footer
	id="app-footer"
	class="fixed bottom-0 z-50 flex h-14 w-full justify-center space-x-5 rounded-none bg-white dark:bg-gray-900"
>
	<FooterLinkGroup
		class="mt-3 flex flex-wrap items-center space-x-3 text-sm text-gray-500 sm:mt-0 dark:text-gray-400"
	>
		<FooterCopyright id="footer-copyright" href="/" by="Dexbooru" year={currentYear} />

		<FooterIcon href="https://github.com/Dexbooru/dexbooru-web" target="_blank">
			<GithubSolid />
		</FooterIcon>
	</FooterLinkGroup>
</Footer>
