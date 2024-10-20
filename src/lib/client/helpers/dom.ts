import DefaultPostPicture from '$lib/client/assets/default_post_picture.webp';
import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
import type { TUser } from '$lib/shared/types/users';
import type { UserPreference } from '@prisma/client';
import { GLOBAL_SEARCH_MODAL_NAME } from '../constants/layout';
import type { IDeviceStoreData } from '../types/device';
import { getActiveModal, getFooter } from './context';

const LAZY_LOADABLE_IMAGES = ['booru-avatar', 'post-carousel-image', 'whole-post-image'];
const LAZY_LOADABLE_IMAGE_DEFAULT_MAP = {
	'booru-avatar': DefaultProfilePicture,
	'post-carousel-image': DefaultPostPicture,
	'whole-post-image': DefaultPostPicture,
};

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

export const registerDocumentEventListeners = (user: TUser, userPreferences: UserPreference) => {
	if (document.readyState !== 'loading') {
		onLoadDocument(user, userPreferences);
	} else {
		document.addEventListener('DOMContentLoaded', () => onLoadDocument(user, userPreferences));
	}

	document.addEventListener('resize', onResizeDocument);
	document.addEventListener('keydown', onKeyDownDocument);
};

export const destroyDocumentEventListeners = (user: TUser, userPreferences: UserPreference) => {
	document.removeEventListener('resize', onResizeDocument);
	document.removeEventListener('DOMContentLoaded', () => onLoadDocument(user, userPreferences));
	document.removeEventListener('keydown', onKeyDownDocument);
};

const onLoadDocument = (user: TUser, userPreferences: UserPreference) => {
	applyCustomSiteWideCss(user, userPreferences);
	lazyLoadImages();
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

const onKeyDownDocument = (event: KeyboardEvent) => {
	if (event.ctrlKey && event.key.toLowerCase() === 'k') {
		event.preventDefault();

		const activeModal = getActiveModal();
		activeModal.set({ isOpen: true, focusedModalName: GLOBAL_SEARCH_MODAL_NAME });
	}
};

const lazyLoadImages = () => {
	const images = document.querySelectorAll('img');
	images.forEach((image) => {
		lazyLoadImage(image);
	});

	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeName.toLowerCase() === 'img') {
					lazyLoadImage(node as HTMLImageElement);
				}
			});
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });
};

const lazyLoadImage = (image: HTMLImageElement) => {
	const imageClassList = Array.from(image.classList);
	const matchingLazyLoadableClassName = LAZY_LOADABLE_IMAGES.find((className) =>
		imageClassList.includes(className),
	);
	if (!matchingLazyLoadableClassName) return;

	image.setAttribute('loading', 'lazy');

	image.style.transition = 'filter 0.5s ease, opacity 0.5s ease';
	image.style.filter = 'blur(5px)';
	image.style.opacity = '0';

	image.onload = () => {
		image.style.filter = 'blur(0px)';
		image.style.opacity = '1';
	};
	image.onerror = () => {
		image.src =
			LAZY_LOADABLE_IMAGE_DEFAULT_MAP[
				matchingLazyLoadableClassName as keyof typeof LAZY_LOADABLE_IMAGE_DEFAULT_MAP
			] ?? '';
	};
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
