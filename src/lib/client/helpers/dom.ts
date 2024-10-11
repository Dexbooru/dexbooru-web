import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.png';
import { get } from 'svelte/store';
import {
	footerStore,
	scrollToTopButtonActiveStore,
	searchModalActiveStore,
} from '../stores/layout';
import { authenticatedUserStore, userPreferenceStore } from '../stores/users';
import type { IDeviceStoreData } from '../types/device';

const scrollThreshold = 0.75;

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

export const registerDocumentEventListeners = () => {
	if (document.readyState !== 'loading') {
		onLoadDocument();
	} else {
		document.addEventListener('DOMContentLoaded', onLoadDocument);
	}

	document.addEventListener('resize', onResizeDocument);
	document.addEventListener('keydown', onKeyDownDocument);
	document.addEventListener('scroll', onDocumentScroll);
};

export const destroyDocumentEventListeners = () => {
	document.removeEventListener('resize', onResizeDocument);
	document.removeEventListener('DOMContentLoaded', onLoadDocument);
	document.removeEventListener('keydown', onKeyDownDocument);
	document.removeEventListener('scroll', onDocumentScroll);
};

const onDocumentScroll = () => {
	const scrollPosition = window.scrollY;
	const documentHeight = document.body.scrollHeight;

	scrollToTopButtonActiveStore.set(scrollPosition > documentHeight * scrollThreshold);
};

const onLoadDocument = () => {
	applyCustomSiteWideCss();
	updateFooterData();
	lazyLoadImages();
	loadErrorProfilePictureImageAvatars();
};

const applyCustomSiteWideCss = () => {
	const user = get(authenticatedUserStore);
	if (!user) return;

	const { customSideWideCss } = get(userPreferenceStore);
	if (typeof customSideWideCss === 'string' && customSideWideCss.length > 0) {
		const customSideWideStylesheet = document.createElement('style');
		customSideWideStylesheet.innerText = customSideWideCss;
		document.head.appendChild(customSideWideStylesheet);
	}
};

const onResizeDocument = () => {
	updateFooterData();
};

const onKeyDownDocument = (event: KeyboardEvent) => {
	if (event.ctrlKey && event.key.toLowerCase() === 'k') {
		event.preventDefault();
		searchModalActiveStore.update((active) => !active);
	}
};

const lazyLoadImages = () => {
	const images = document.querySelectorAll('img');
	images.forEach((img) => img.setAttribute('loading', 'lazy'));

	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeName.toLowerCase() === 'img') {
					(node as HTMLElement).setAttribute('loading', 'lazy');
				}
			});
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });
};

const loadErrorProfilePictureImageAvatars = () => {
	const postCardAvatars = Array.from(
		document.getElementsByClassName('post-card-avatar'),
	) as HTMLImageElement[];
	postCardAvatars.forEach((postCardAvatar) => {
		postCardAvatar.onerror = () => {
			postCardAvatar.src = DefaultProfilePicture;
		};
	});
};

const updateFooterData = () => {
	const footerElement = document.querySelector('#app-footer') as HTMLElement;

	if (footerElement) {
		const footerHeight = footerElement.clientHeight;
		const screenHeight = document.body.scrollHeight;

		footerStore.set({
			height: footerHeight,
			bottom: screenHeight - footerHeight,
			element: footerElement,
		});
	}
};
