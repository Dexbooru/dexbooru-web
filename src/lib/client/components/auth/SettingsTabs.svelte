<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { SESSION_ID_KEY } from '$lib/shared/constants/session';
	import { toast } from '@zerodevx/svelte-toast';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import { GridSolid, UserCircleSolid } from 'flowbite-svelte-icons';
	import { onDestroy, onMount } from 'svelte';
	import type { ActionData } from '../../../../routes/profile/settings/$types';
	import ChangePasswordForm from './ChangePasswordForm.svelte';
	import ChangeProfilePicture from './ChangeProfilePicture.svelte';
	import ChangeUsernameForm from './ChangeUsernameForm.svelte';
	import DeleteAccountForm from './DeleteAccountForm.svelte';
	import Enable2faForm from './Enable2faForm.svelte';
	import PostPreferencesForm from './PostPreferencesForm.svelte';
	import UserInterfacePreferenceForm from './UserInterfacePreferenceForm.svelte';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	const errorReason = form ? form.reason : null;
	const errorType = form ? form.type : null;

	const validTabNames = ['personal', 'preferences', 'security'] as const;
	let currentTab: string = $state('personal');

	const message = form ? form.message : null;

	if (message) {
		toast.push(message, SUCCESS_TOAST_OPTIONS);
	}

	const handleTabClick = (tabName: string) => {
		if (currentTab === tabName) return;

		currentTab = tabName;
		goto(`?tab=${tabName}`);
	};

	const pageSubscribe = page.subscribe((data) => {
		const searchParams = data.url.searchParams;
		const tabName = searchParams.get('tab') as 'personal' | 'preferences';
		if (tabName) {
			currentTab = validTabNames.includes(tabName) ? tabName : 'personal';
		}
	});

	onMount(() => {
		const newAuthToken = form ? form.newAuthToken : null;

		if (typeof newAuthToken === 'string' && newAuthToken.length > 0) {
			localStorage.setItem(SESSION_ID_KEY, newAuthToken);
		}
	});

	onDestroy(() => {
		pageSubscribe();
	});
</script>

<Tabs defaultClass="flex flex-wrap space-x-2 rtl:space-x-revers !p-3" style="underline">
	<TabItem on:click={() => handleTabClick('personal')} open={currentTab === 'personal'}>
		{#snippet title()}
				<div  class="flex items-center gap-2">
				<UserCircleSolid size="md" />
				Personal
			</div>
			{/snippet}
		<section class="flex flex-wrap gap-4 items-start">
			<ChangeUsernameForm error={errorReason} {errorType} />
			<ChangePasswordForm error={errorReason} {errorType} />
			<ChangeProfilePicture error={errorReason} {errorType} />
			<DeleteAccountForm error={errorReason} {errorType} />
		</section>
	</TabItem>
	<TabItem
		on:click={() => handleTabClick('preferences')}
		title="Preferences"
		open={currentTab === 'preferences'}
	>
		<!-- @migration-task: migrate this slot by hand, `title` would shadow a prop on the parent component -->
	<div slot="title" class="flex items-center gap-2">
			<GridSolid size="md" />
			Preferences
		</div>
		<section class="flex flex-wrap gap-4 items-start">
			<PostPreferencesForm error={errorReason} {errorType} />
			<UserInterfacePreferenceForm error={errorReason} {errorType} />
		</section>
	</TabItem>
	<TabItem
		open={currentTab === 'security'}
		on:click={() => handleTabClick('security')}
		title="Security"
	>
		<section class="flex flex-wrap gap-4 items-start">
			<Enable2faForm error={errorReason} {errorType} />
		</section>
	</TabItem>
</Tabs>
