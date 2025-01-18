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
