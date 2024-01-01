import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import { error } from '@sveltejs/kit';
import { VALID_ORDERBY_COLUMNS } from '../db/actions/post';

export const processPageNumberFromParams = (searchParams: URLSearchParams): number => {
	const rawPageNumber = searchParams.get('pageNumber') || '0';
	const convertedPageNumber = parseInt(rawPageNumber);

	if (isNaN(convertedPageNumber)) {
		throw error(400, {
			message: 'The page number parameter must be in a valid number format!'
		});
	}

	if (convertedPageNumber < 0) {
		throw error(400, { message: 'The page number parameter must be a positive, whole number!' });
	}

	return convertedPageNumber;
};

export const processOrderByFromParams = (searchParams: URLSearchParams): TPostOrderByColumn => {
	const orderBy = searchParams.get('orderBy') || 'createdAt';

	if (!VALID_ORDERBY_COLUMNS.includes(orderBy as TPostOrderByColumn)) {
		throw error(400, {
			message: `The order by parameter must be one of: ${VALID_ORDERBY_COLUMNS.join(', ')}!`
		});
	}

	return orderBy as TPostOrderByColumn;
};

export const processAscendingFromParams = (searchParams: URLSearchParams): boolean => {
	const ascending = searchParams.get('ascending') || 'false';
	if (ascending !== 'true' && ascending !== 'false') {
		throw error(400, { message: 'The ascending parameter must be either true or false!' });
	}

	const convertedAscending = ascending === 'true' ? true : false;

	return convertedAscending;
};

export const processPostPageParams = (searchParams: URLSearchParams) => {
	const pageNumber = searchParams.get('pageNumber') || '0';
	const orderBy = searchParams.get('orderBy') || 'createdAt';
	const ascending = searchParams.get('ascending') || 'false';

	const convertedPageNumber = parseInt(pageNumber);

	if (isNaN(convertedPageNumber)) {
		throw error(400, {
			message: 'The page number parameter must be in a valid number format!'
		});
	}

	if (convertedPageNumber < 0) {
		throw error(400, { message: 'The page number parameter must be a positive, whole number!' });
	}

	if (!VALID_ORDERBY_COLUMNS.includes(orderBy as TPostOrderByColumn)) {
		throw error(400, {
			message: `The order by parameter must be one of: ${VALID_ORDERBY_COLUMNS.join(', ')}!`
		});
	}

	if (ascending !== 'true' && ascending !== 'false') {
		throw error(400, { message: 'The ascending parameter must be either true or false!' });
	}

	const convertedAscending = ascending === 'true' ? true : false;

	return {
		convertedPageNumber,
		convertedAscending,
		orderBy
	};
};
