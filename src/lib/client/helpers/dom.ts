import { footerStore } from '../stores/layout';
import type { IDeviceStoreData } from '../types/device';

export const getDeviceDetectionDataFromWindow = (): IDeviceStoreData => {
	const windowWidth = window.innerWidth;

	const isMobile = windowWidth <= 768;
	const isTablet = windowWidth > 768 && windowWidth <= 1024;
	const isDesktop = windowWidth > 1024;

	return {
		isMobile,
		isTablet,
		isDesktop
	};
};

export const registerDocumentEventListeners = () => {
	document.addEventListener('DOMContentLoaded', onLoadDocument);
	document.addEventListener('resize', onResizeDocument);
};

export const destroyDocumentEventListeners = () => {
	document.removeEventListener('resize', onResizeDocument);
	document.removeEventListener('load', onLoadDocument);
};

const onLoadDocument = () => {
	updateFooterData();
};

const onResizeDocument = () => {
	updateFooterData();
};

const updateFooterData = () => {
	const footerElement = document.querySelector('#app-footer') as HTMLElement;

	if (footerElement) {
		const footerHeight = footerElement.clientHeight;
		const screenHeight = document.body.scrollHeight;

		footerStore.set({
			height: footerHeight,
			bottom: screenHeight - footerHeight,
			element: footerElement
		});
	}
};
