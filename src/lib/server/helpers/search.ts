import { Prisma } from '$generated/prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/client';
import { UUID_REGEX } from '$lib/shared/constants/search';
import { URL_REGEX } from '$lib/shared/constants/urls';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../constants/posts';
import type { TControllerHandlerVariant } from '../types/controllers';

const VALID_OPERATIONS: readonly TOperation[] = ['!=', '<', '<=', '>', '>=', '='];
const VALID_PREFIXES: readonly TPrefix[] = [
	'id',
	'createdAt',
	'updatedAt',
	'uploader',
	'likes',
	'views',
	'moderationStatus',
	'sourceLink',
];

const NEGATION_TABLE: Record<TOperation, TOperation> = {
	'!=': '=',
	'=': '!=',
	'<': '>=',
	'>': '<=',
	'<=': '>',
	'>=': '<',
};
const OPERATION_TO_PRISMA_TABLE: Record<TOperation, string> = {
	'<': 'lt',
	'<=': 'lte',
	'>': 'gt',
	'>=': 'gte',
	'=': 'equals',
	'!=': 'nequals',
};

type TOperation = '!=' | '=' | '>' | '<' | '>=' | '<=';
type TPrefix =
	| 'uploader'
	| 'moderationStatus'
	| 'sourceLink'
	| 'likes'
	| 'views'
	| 'createdAt'
	| 'updatedAt'
	| 'id';
type TQueryToken = {
	isNegation: boolean;
	operation?: TOperation;
	prefix?: TPrefix;
	value: unknown;
};
type TPostSelectMany = Prisma.PostFindManyArgs<DefaultArgs>;

type TQueryBuilderInput = {
	rawQuery: string;
	pageNumber: number;
	limit: number;
	ascending: boolean;
	orderBy: TPostOrderByColumn;
	handlerType: TControllerHandlerVariant;
};

class QueryBuilder {
	private rawQuery: string;
	private pageNumber: number;
	private limit: number;
	private ascending: boolean;
	private orderBy: TPostOrderByColumn;
	private handlerType: TControllerHandlerVariant;

	constructor({
		rawQuery,
		pageNumber,
		limit,
		handlerType,
		ascending,
		orderBy,
	}: TQueryBuilderInput) {
		this.rawQuery = rawQuery;
		this.pageNumber = pageNumber;
		this.limit = limit;
		this.ascending = ascending;
		this.orderBy = orderBy;
		this.handlerType = handlerType;
	}

	private parseValue(prefix: TPrefix, value: string) {
		let parsedDate: Date | undefined;
		let parsedNum: number | undefined;

		switch (prefix) {
			case 'createdAt':
			case 'updatedAt':
				parsedDate = new Date(value);
				if (isNaN(parsedDate.getTime()))
					throw new Error(`Value provided for ${prefix} was not a date format`);
				return parsedDate;

			case 'sourceLink':
				if (!URL_REGEX.test(value)) throw new Error('Invalid URL format for source link');
				return value;

			case 'moderationStatus':
			case 'uploader':
				return value;

			case 'id':
				if (!UUID_REGEX.test(value)) throw new Error('Invalid UUIDv4 format for post id');
				return value;

			case 'views':
			case 'likes':
				parsedNum = parseInt(value);
				if (isNaN(parsedNum)) throw new Error(`Value provided for ${prefix} was not a number`);
				return parsedNum;
		}
	}

	private parseOperation(prefix: TPrefix, isNegation: boolean, value: string): TOperation {
		if (prefix === 'uploader') return '=';

		let operationCount = 0;
		let lastOperation: TOperation | undefined = undefined;

		for (const operation of VALID_OPERATIONS) {
			if (value.startsWith(operation)) {
				operationCount++;
				lastOperation = operation;
			}
		}

		if (operationCount === 0 || operationCount > 1 || lastOperation === undefined)
			throw new Error(
				'Invalid operation found or the given value contained more than one valid operation',
			);

		return isNegation ? NEGATION_TABLE[lastOperation] : lastOperation;
	}

	private getQueryToken(queryPart: string): TQueryToken {
		const colonIndex = queryPart.indexOf(':');
		const splitSize = queryPart.split(':').length;

		if (splitSize === 2) {
			const subQueryPartPortions = [
				queryPart.slice(0, colonIndex),
				queryPart.slice(colonIndex + 1),
			];
			const [wholePrefix, value] = subQueryPartPortions;
			const isNegation = wholePrefix.charAt(0) === '-';
			const prefix = (isNegation ? wholePrefix.slice(1) : wholePrefix) as TPrefix;

			if (!VALID_PREFIXES.includes(prefix))
				throw new Error(`Invalid prefix: ${prefix} for the value: ${value}`);

			const operation = this.parseOperation(prefix, isNegation, value);
			const trimmedValue = value.replaceAll(operation, '');
			const parsedValue = this.parseValue(prefix, trimmedValue);

			return {
				isNegation,
				prefix,
				operation,
				value: parsedValue,
			};
		}

		const isNegation = queryPart.charAt(0) === '-';
		const singleValue = isNegation ? queryPart.slice(1) : queryPart;
		return {
			isNegation,
			value: singleValue,
		};
	}

	private parseQueryTokens(): TQueryToken[] {
		const queryParts = this.rawQuery.trim().split(' ');
		const queryTokens: TQueryToken[] = [];

		for (const queryPart of queryParts) {
			const queryToken = this.getQueryToken(queryPart);
			queryTokens.push(queryToken);
		}

		return queryTokens;
	}

	buildOrmQuery(): TPostSelectMany {
		const queryTokens = this.parseQueryTokens();
		const ormQuery: TPostSelectMany = {
			where: {
				NOT: [] as Prisma.PostWhereInput[],
				AND: [] as Prisma.PostWhereInput[],
			},
		};

		if (queryTokens.length === 0) return ormQuery;
		if (!Array.isArray(ormQuery.where?.AND) || !Array.isArray(ormQuery.where?.NOT))
			throw new Error('ORM query where object was not initialized properly');

		for (const queryToken of queryTokens) {
			const { isNegation, prefix, operation, value } = queryToken;

			if (prefix && operation) {
				const condition: Prisma.PostWhereInput = {};
				if (prefix === 'uploader') {
					if (UUID_REGEX.test(value as string)) {
						condition.author = {
							id: value as string,
						};
					} else {
						condition.author = {
							username: {
								equals: value as string,
							},
						};
					}
				} else {
					condition[prefix] = {
						[OPERATION_TO_PRISMA_TABLE[operation]]: value,
					};
				}

				if (isNegation) {
					ormQuery.where?.NOT?.push(condition);
				} else {
					ormQuery.where?.AND?.push(condition);
				}
			} else {
				const condition: Prisma.PostWhereInput = {
					OR: [
						{
							tags: {
								some: {
									name: {
										equals: value as string,
									},
								},
							},
						},
						{
							artists: {
								some: {
									name: {
										equals: value as string,
									},
								},
							},
						},
					],
				};

				if (isNegation) {
					ormQuery.where?.NOT?.push(condition);
				} else {
					ormQuery.where?.AND?.push(condition);
				}
			}
		}

		if (Array.isArray(ormQuery.where?.AND) && ormQuery.where?.AND.length === 0)
			delete ormQuery.where?.AND;
		if (Array.isArray(ormQuery.where?.NOT) && ormQuery.where?.NOT.length === 0)
			delete ormQuery.where?.NOT;

		ormQuery.take = this.limit;
		ormQuery.skip = this.pageNumber * this.limit;
		ormQuery.orderBy = {
			[this.orderBy]: this.ascending ? 'asc' : 'desc',
		};
		ormQuery.select =
			this.handlerType === 'page-server-load'
				? PAGE_SERVER_LOAD_POST_SELECTORS
				: PUBLIC_POST_SELECTORS;

		return ormQuery;
	}
}

export default QueryBuilder;
