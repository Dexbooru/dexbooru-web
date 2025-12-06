export const groupBy = <T>(
	arr: T[],
	keyFn: (_item: T, _index: number) => string | number,
): Record<string | number, T[]> => {
	return arr.reduce(
		(acc, item, index) => {
			const group = keyFn(item, index);
			if (!acc[group]) {
				acc[group] = [];
			}
			acc[group].push(item);
			return acc;
		},
		{} as Record<string | number, T[]>,
	);
};

export const capitalize = (target: string): string => {
	return target.charAt(0).toLocaleUpperCase() + target.slice(1).toLocaleLowerCase();
};

export const interleaveStrings = (a: string, b: string): string => {
	let interleavedResult = '';
	let [i, j, k] = [0, 0, 0];
	const resultLength = a.length + b.length;

	while (k < resultLength && i < a.length && j < b.length) {
		if (k % 2 === 0) {
			interleavedResult += a.charAt(i);
			i++;
		} else {
			interleavedResult += a.charAt(j);
			j++;
		}

		k++;
	}

	while (i < a.length) {
		interleavedResult += a.charAt(i);
		i++;
	}

	while (j < b.length) {
		interleavedResult += b.charAt(j);
		j++;
	}

	return interleavedResult;
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
	const result = [];
	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}
	return result;
};
