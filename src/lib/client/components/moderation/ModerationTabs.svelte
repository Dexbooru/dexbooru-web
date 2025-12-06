<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getCollectionsReports } from '$lib/client/api/collectionReports';
	import { getModerators } from '$lib/client/api/moderation';
	import { getPostsReports } from '$lib/client/api/postReports';
	import { getUsersReports } from '$lib/client/api/userReports';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUser, getModerationPaginationData } from '$lib/client/helpers/context';
	import { isModerationRole } from '$lib/shared/helpers/auth/role';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { TUser } from '$lib/shared/types/users';
	import type { PostCollectionReport, PostReport, UserReport } from '@prisma/client';
	import { toast } from '@zerodevx/svelte-toast';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import ModList from './ModList.svelte';
	import ReportGrid from './ReportGrid.svelte';

	type TTabName =
		| 'user-reports'
		| 'post-reports'
		| 'post-collection-reports'
		| 'moderator-list'
		| '';

	let currentTab = $state<TTabName>((page.url.searchParams.get('tab') as TTabName) ?? '');
	let moderatorsLoading = $state(false);
	let postReportsLoading = $state(false);
	let postCollectionReportsLoading = $state(false);
	let userReportsLoading = $state(false);

	const TAB_TITLES: Partial<Record<TTabName, string>> = {
		'moderator-list': 'Moderator List',
		'post-collection-reports': 'Post Collection Reports',
		'post-reports': 'Post Reports',
		'user-reports': 'User Reports',
	};

	const TAB_CONTAINER_IDS: Partial<Record<TTabName, string>> = {
		'moderator-list': 'moderation-container',
		'post-collection-reports': 'post-collection-report-container',
		'post-reports': 'post-report-container',
		'user-reports': 'user-report-container',
	};

	const handleTabChange = (tabName: TTabName) => {
		if (currentTab === tabName) return;

		currentTab = tabName;
		goto(`?tab=${tabName}`);
	};

	const handleLoadPostReports = async (fromTabClick: boolean) => {
		const loadedPostReports = get(moderationData)?.postReports ?? [];
		const postReportsPageNumber = get(moderationData)?.postReportPageNumber ?? 0;

		if (fromTabClick && loadedPostReports.length > 0) return;

		postReportsLoading = true;

		const response = await getPostsReports(postReportsPageNumber);
		if (response.ok) {
			const responseData: TApiResponse<{ postReports: PostReport[] }> = await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					postReports: responseData.data.postReports,
				};
			});
		} else {
			toast.push(
				'An unexpected error occured while fetching the post reports',
				FAILURE_TOAST_OPTIONS,
			);
		}

		postReportsLoading = false;
	};

	const handleLoadCollectionReports = async (fromTabClick: boolean) => {
		const loadedCollectionReports = get(moderationData)?.postCollectionReports ?? [];
		const collectionReportsPageNumber = get(moderationData)?.postCollectionReportPageNumber ?? 0;

		if (fromTabClick && loadedCollectionReports.length > 0) return;

		postCollectionReportsLoading = true;

		const response = await getCollectionsReports(collectionReportsPageNumber);
		if (response.ok) {
			const responseData: TApiResponse<{ postCollectionReports: PostCollectionReport[] }> =
				await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					postCollectionReports: responseData.data.postCollectionReports,
				};
			});
		} else {
			toast.push(
				'An unexpected error occurred while fetching the collection reports',
				FAILURE_TOAST_OPTIONS,
			);
		}

		postCollectionReportsLoading = false;
	};

	const handleLoadUserReports = async (fromTabClick: boolean) => {
		const loadedUserReports = get(moderationData)?.userReports ?? [];
		const userReportsPageNumber = get(moderationData)?.userReportPageNumber ?? 0;

		if (fromTabClick && loadedUserReports.length > 0) return;

		userReportsLoading = true;

		const response = await getUsersReports(userReportsPageNumber);
		if (response.ok) {
			const responseData: TApiResponse<{ userReports: UserReport[] }> = await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					userReports: responseData.data.userReports,
				};
			});
		} else {
			toast.push(
				'An unexpected error occurred while fetching the user reports',
				FAILURE_TOAST_OPTIONS,
			);
		}

		userReportsLoading = false;
	};

	const handleLoadModerators = async () => {
		if ((get(moderationData)?.moderators ?? []).length > 0) return;

		moderatorsLoading = true;

		const response = await getModerators();
		if (response.ok) {
			const responseData: TApiResponse<{ moderators: TUser[] }> = await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					moderators: responseData.data.moderators,
				};
			});
		} else {
			toast.push(
				'An unexpected error occured while fetching the moderators',
				FAILURE_TOAST_OPTIONS,
			);
		}

		moderatorsLoading = false;
	};

	const handleTabClick = async (tabName: TTabName) => {
		handleTabChange(tabName);

		switch (tabName) {
			case 'moderator-list':
				await handleLoadModerators();
				break;
			case 'post-collection-reports':
				await handleLoadCollectionReports(true);
				break;
			case 'post-reports':
				await handleLoadPostReports(true);
				break;
			case 'user-reports':
				await handleLoadUserReports(true);
				break;
			default:
				break;
		}
	};

	const user = getAuthenticatedUser();
	const moderationData = getModerationPaginationData();

	onMount(() => {
		if (currentTab !== '') {
			handleTabClick(currentTab);
		}

		const moderationLink = document.getElementById('moderation-link') as HTMLAnchorElement;
		const onClickClearCurrentTab = () => {
			currentTab = '';

			Object.values(TAB_CONTAINER_IDS).forEach((containerId) => {
				const container = document.getElementById(containerId) as Element;
				if (container) {
					container.innerHTML = '';
				}
			});
		};
		if (moderationLink) {
			moderationLink.addEventListener('click', onClickClearCurrentTab);
		}

		return () => {
			moderationData.set({
				postCollectionReports: [],
				postCollectionReportPageNumber: 0,
				postReports: [],
				postReportPageNumber: 0,
				userReports: [],
				userReportPageNumber: 0,
				moderators: [],
			});

			if (moderationLink) {
				moderationLink.removeEventListener('click', onClickClearCurrentTab);
			}
		};
	});
</script>

<svelte:head>
	<title>Moderation Dashboard {currentTab.length > 0 ? `| ${TAB_TITLES[currentTab]}` : ''}</title>
</svelte:head>

<Tabs class="mt-5" tabStyle="underline">
	<TabItem
		onclick={() => handleTabClick('user-reports')}
		open={currentTab === 'user-reports'}
		title="User Reports"
	>
		<ReportGrid
			containerId={TAB_CONTAINER_IDS['user-reports'] ?? ''}
			reportType="userReports"
			handleLoadMoreReports={() => handleLoadUserReports(false)}
			loadingReports={userReportsLoading}
		/>
	</TabItem>
	<TabItem
		onclick={() => handleTabClick('post-reports')}
		open={currentTab === 'post-reports'}
		title="Post Reports"
	>
		<ReportGrid
			containerId={TAB_CONTAINER_IDS['post-reports'] ?? ''}
			reportType="postReports"
			handleLoadMoreReports={() => handleLoadPostReports(false)}
			loadingReports={postReportsLoading}
		/>
	</TabItem>
	<TabItem
		onclick={() => handleTabClick('post-collection-reports')}
		open={currentTab === 'post-collection-reports'}
		title="Post Collection Reports"
	>
		<ReportGrid
			containerId={TAB_CONTAINER_IDS['post-collection-reports'] ?? ''}
			reportType="postCollectionReports"
			handleLoadMoreReports={() => handleLoadCollectionReports(false)}
			loadingReports={postCollectionReportsLoading}
		/>
	</TabItem>
	{#if $user && isModerationRole($user.role)}
		<TabItem
			onclick={() => handleTabClick('moderator-list')}
			open={currentTab === 'moderator-list'}
			disabled={!isModerationRole($user.role)}
			title="Moderator List"
		>
			{#if moderatorsLoading}
				<Spinner size="12" />
			{:else}
				<ModList containerId={TAB_CONTAINER_IDS['moderator-list'] ?? ''} />
			{/if}
		</TabItem>
	{/if}
</Tabs>

{#if currentTab === ''}
	<div
		class="mt-6 p-5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-center w-3/4 m-auto"
	>
		<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
			Welcome to the Dexbooru Moderation Dashboard!
		</h2>
		<p class="text-gray-600 dark:text-gray-300 mt-2">
			Select a tab above to start moderating posts, users, and collections.
		</p>
	</div>
{/if}
