export const updateLabelMetadata = async (
	labelType: 'tag' | 'artist',
	labelName: string,
	body: { description?: string; socialMediaLinks?: string[] },
) => {
	const path = `/api/${labelType + 's'}/metadata/${labelName}`;
	return await fetch(path, {
		method: 'PUT',
		body: JSON.stringify(body),
	});
};

export const getLabelMetadata = async (labelType: 'tag' | 'artist', labelName: string) => {
	const path = `/api/${labelType + 's'}/metadata/${labelName}`;
	return await fetch(path);
};
