import { MONTHS } from '../constants/dates';

export function getTimeDifferenceString(targetDatetime: Date) {
	const today = new Date();
	const timeDifference = today.getUTCMilliseconds() - targetDatetime.getUTCMilliseconds();

	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;
	const month = 30 * day;
	const year = 365 * day;

	if (timeDifference < minute) {
		const seconds = Math.floor(timeDifference / 1000);
		return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
	}

	if (timeDifference < hour) {
		const minutes = Math.floor(timeDifference / minute);
		return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
	}

	if (timeDifference < day) {
		const hours = Math.floor(timeDifference / hour);
		return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
	}

	if (timeDifference < month) {
		const days = Math.floor(timeDifference / day);
		return `${days} day${days !== 1 ? 's' : ''} ago`;
	}

	if (timeDifference < year) {
		const months = Math.floor(timeDifference / month);
		return `${months} month${months !== 1 ? 's' : ''} ago`;
	}

	const years = Math.floor(timeDifference / year);
	return `${years} year${years !== 1 ? 's' : ''} ago`;
}

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
