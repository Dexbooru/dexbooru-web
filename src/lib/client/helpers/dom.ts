import { footerStore } from '../stores/layout';

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
