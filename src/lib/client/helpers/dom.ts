import type { TUser } from '$lib/shared/types/users';
import type { UserPreference } from '@prisma/client';
import type { Writable } from 'svelte/store';
import { LAZY_LOADABLE_IMAGES, LAZY_LOADABLE_IMAGE_DEFAULT_MAP } from '../constants/dom';
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

const applyCustomSiteWideCss = (user: TUser, userPreferences: UserPreference) => {
	if (!user) return;

	const { customSideWideCss } = userPreferences;
	if (typeof customSideWideCss === 'string' && customSideWideCss.length > 0) {
		const customSideWideStylesheet = document.createElement('style');
		customSideWideStylesheet.innerText = customSideWideCss;
		document.head.appendChild(customSideWideStylesheet);
	}
};

const onResizeDocument = () => {
	updateFooterData();
};

const onKeyDownDocument = (event: KeyboardEvent, activeModal: Writable<TModalStoreData>) => {
	if (event.ctrlKey && event.key.toLowerCase() === 'k') {
		event.preventDefault();

		activeModal.update((data) => {
			return {
				isOpen: !data.isOpen,
				focusedModalName: data.isOpen ? null : GLOBAL_SEARCH_MODAL_NAME,
			};
		});
	}
};

export const applyLazyLoadingOnImageClass = (
	className: keyof typeof LAZY_LOADABLE_IMAGE_DEFAULT_MAP,
) => {
	const matchingImageElements = Array.from(
		document.getElementsByClassName(className),
	) as HTMLImageElement[];
	matchingImageElements.forEach((matchingImageElement) => lazyLoadImage(matchingImageElement));
};

export const lazyLoadImage = (image: HTMLImageElement) => {
	const imageClassList = Array.from(image.classList);
	const matchingLazyLoadableClassName = LAZY_LOADABLE_IMAGES.find((className) =>
		imageClassList.includes(className),
	);
	if (!matchingLazyLoadableClassName) return;

	if (!image.complete) {
		image.src =
			LAZY_LOADABLE_IMAGE_DEFAULT_MAP[
				matchingLazyLoadableClassName as keyof typeof LAZY_LOADABLE_IMAGE_DEFAULT_MAP
			] ?? '';
		return;
	}

	if (image.onabort && image.onerror && image.onload) return;

	image.setAttribute('loading', 'lazy');
	image.style.transition = 'filter 0.5s ease, opacity 0.5s ease';
	image.style.filter = 'blur(5px)';
	image.style.opacity = '0';

	const assignFallbackImage = () => {
		image.src =
			LAZY_LOADABLE_IMAGE_DEFAULT_MAP[
				matchingLazyLoadableClassName as keyof typeof LAZY_LOADABLE_IMAGE_DEFAULT_MAP
			] ?? '';
	};

	image.onload = () => {
		image.style.filter = 'blur(0px)';
		image.style.opacity = '1';
	};
	image.onabort = assignFallbackImage;
	image.onerror = assignFallbackImage;
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
