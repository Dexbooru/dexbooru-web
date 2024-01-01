import { MONTHS } from '../constants/dates';

export function formatDate(date: Date): string {
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZoneName: 'short'
	};

	const formatter = new Intl.DateTimeFormat('en-US', options);
	const formattedDate = formatter.format(date).replace(',', '');

	return formattedDate;
}

export const ymdFormat = (date: Date): string => {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');

	return `${year}-${month}-${day}`;
};

export function getFormalDateTitle(date: Date) {
	const day = date.getDate();
	const month = MONTHS[date.getMonth()];
	const year = date.getFullYear();

	// Function to add ordinal suffix to day
	const getOrdinalSuffix = (target: number) => {
		const suffixes = ['th', 'st', 'nd', 'rd'];
		const lastDigit = target % 10;
		const suffix =
			lastDigit > 0 && lastDigit <= 3 && (target < 11 || target > 13)
				? suffixes[lastDigit]
				: suffixes[0];
		return `${target}${suffix}`;
	};

	const formattedDay = getOrdinalSuffix(day);

	return `${month} ${formattedDay}, ${year}`;
}

export function convertDataStructureToIncludeDatetimes<T>(
	items: T[],
	dateFields: (keyof T)[]
): T[] {
	return items.map((item) => {
		const parsedDateStructure: Partial<T> = {};

		dateFields.forEach((dateField) => {
			const convertedDate = new Date(item[dateField] as string);
			parsedDateStructure[dateField] = convertedDate as T[keyof T];
		});

		return {
			...item,
			...parsedDateStructure
		};
	});
}
