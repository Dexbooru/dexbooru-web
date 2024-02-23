export function getQueryParts(
	fullText: string,
	query: string
): { text: string; type: 'highlight' | 'normal' }[] {
	const substringRanges = [];

	let currentStartIndex = fullText.indexOf(query);
	while (currentStartIndex !== -1) {
		const currentEndIndex = currentStartIndex + query.length;
		substringRanges.push([currentStartIndex, currentEndIndex - 1]);
		currentStartIndex = fullText.indexOf(query, currentEndIndex);
	}

	if (substringRanges.length === 0) {
		return [{ text: fullText, type: 'normal' }];
	}

	const parts: { text: string; type: 'highlight' | 'normal' }[] = [];
	let substringRangeIndex = 0;
	let currentPart = '';
	let strIndex = 0;

	while (strIndex < fullText.length) {
		const [substringRangeStart, substringRangeEnd] =
			substringRangeIndex < substringRanges.length
				? substringRanges[substringRangeIndex]
				: [-1, -1];

		if (strIndex === substringRangeStart) {
			if (currentPart.length > 0) {
				parts.push({ text: currentPart, type: 'normal' });
			}
			currentPart = '';

			const fullTextSlice = fullText.slice(substringRangeStart, substringRangeEnd + 1);
			if (fullTextSlice.length > 0) {
				parts.push({
					text: fullTextSlice,
					type: 'highlight'
				});
			}
			strIndex = substringRangeEnd + 1;

			substringRangeIndex++;
		} else {
			currentPart += fullText.charAt(strIndex);
			strIndex++;
		}
	}

	return parts;
}
