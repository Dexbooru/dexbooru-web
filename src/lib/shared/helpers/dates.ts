import { MONTHS } from '../constants/dates';

const DATE_KEYS = ['createdAt', 'updatedAt'];

const minute = 60 * 1000;
const hour = 60 * minute;
const day = 24 * hour;
const month = 30 * day;
const year = 365 * day;

export function getTimeDifferenceString(targetDatetime: Date) {
	const now = new Date().getTime();
	const targetTime = targetDatetime.getTime();
	const timeDifference = now - targetTime;

	const times = [
		{ limit: year, label: 'year' },
		{ limit: month, label: 'month' },
		{ limit: day, label: 'day' },
		{ limit: hour, label: 'hour' },
		{ limit: minute, label: 'minute' },
		{ limit: 1000, label: 'second' }
	];

	for (const { limit, label } of times) {
		if (timeDifference >= limit) {
			const time = Math.floor(timeDifference / limit);
			return `${time} ${label}${time !== 1 ? 's' : ''} ago`;
		}
	}

	return 'just now';
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


const tryDateConvert = (key: string, target: unknown): Date | unknown => {
	try {
		if (!DATE_KEYS.includes(key)) return target;

		const testDate = new Date(target as string | number | Date);
		return testDate;
	} catch {
		return target;
	}
};

export const convertDataStructureToIncludeDatetimes = (target: object) => {
	const convertedObject = Array.isArray(target) ? [] as unknown[] : {} as Record<string, unknown>;

	for (const [key, value] of Object.entries(target)) {
		let convertedValue;
		if (typeof value === 'object') {
			convertedValue = convertDataStructureToIncludeDatetimes(value);
		} else {
			convertedValue = tryDateConvert(key, value);
		}

		if (Array.isArray(convertedObject)) {
			convertedObject.push(convertedValue);
		} else {
			convertedObject[key] = convertedValue;
		}
	}

	return convertedObject;
};


