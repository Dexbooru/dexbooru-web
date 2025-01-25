import type { TUser } from '$lib/shared/types/users';
import type { UserPreference } from '@prisma/client';
import type { Writable } from 'svelte/store';
import { GLOBAL_SEARCH_MODAL_NAME } from '../constants/layout';
import type { IDeviceStoreData } from '../types/device';
import type { TModalStoreData } from '../types/stores';
import { getFooter } from './context';

export const getDeviceDetectionDataFromWindow = (): IDeviceStoreData => {
	const windowWidth = window.innerWidth;

	const isMobile = windowWidth <= 768;
	const isTablet = windowWidth > 768 && windowWidth <= 1024;
	const isDesktop = windowWidth > 1024;

	return {
		isMobile,
		isTablet,
		isDesktop,
	};
};

export const registerDocumentEventListeners = (
	user: TUser,
	userPreferences: UserPreference,
	activeModal: Writable<TModalStoreData>,
) => {
	if (document.readyState !== 'loading') {
		onLoadDocument(user, userPreferences);
	} else {
		document.addEventListener('DOMContentLoaded', () => onLoadDocument(user, userPreferences));
	}

	document.addEventListener('resize', onResizeDocument);
	document.addEventListener('keydown', (event) => onKeyDownDocument(event, activeModal));
};

export const destroyDocumentEventListeners = (
	user: TUser,
	userPreferences: UserPreference,
	activeModal: Writable<TModalStoreData>,
) => {
	document.removeEventListener('resize', onResizeDocument);
	document.removeEventListener('DOMContentLoaded', () => onLoadDocument(user, userPreferences));
	document.removeEventListener('keydown', (event) => onKeyDownDocument(event, activeModal));
};

const onLoadDocument = (user: TUser, userPreferences: UserPreference) => {
	applyCustomSiteWideCss(user, userPreferences);
};

export const applyCustomSiteWideCss = (user: TUser, userPreferences: UserPreference) => {
	if (!user || !userPreferences) return;

	const { customSideWideCss } = userPreferences;
	if (typeof customSideWideCss === 'string') {
		if (customSideWideCss.length > 0) {
			const customSideWideStylesheet = document.createElement('style');
			customSideWideStylesheet.innerText = customSideWideCss;
			customSideWideStylesheet.id = 'custom-site-wide-css';
			document.head.appendChild(customSideWideStylesheet);
		} else {
			const customSideWideStylesheet = document.getElementById('custom-site-wide-css');
			if (customSideWideStylesheet) {
				customSideWideStylesheet.remove();
			}
		}
	}
};

const onResizeDocument = () => {
	updateFooterData();
};

const onKeyDownDocument = (event: KeyboardEvent, activeModal: Writable<TModalStoreData>) => {
	if (event.ctrlKey && event.key.toLocaleLowerCase() === 'k') {
		event.preventDefault();

		activeModal.update((data) => {
			return {
				isOpen: !data.isOpen,
				focusedModalName: data.isOpen ? null : GLOBAL_SEARCH_MODAL_NAME,
			};
		});
	}
};

const updateFooterData = () => {
	const footerElement = document.querySelector('#app-footer') as HTMLElement;

	if (footerElement) {
		const footerHeight = footerElement.clientHeight;
		const screenHeight = document.body.scrollHeight;

		const footer = getFooter();
		footer.set({
			height: footerHeight,
			bottom: screenHeight - footerHeight,
			element: footerElement,
		});
	}
};
