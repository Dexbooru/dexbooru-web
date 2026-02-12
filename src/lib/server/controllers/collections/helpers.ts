export const createCollectionFormErrorData = (
	errorData: Record<string, unknown>,
	message: string,
) => {
	return {
		...errorData,
		reason: message,
	};
};
