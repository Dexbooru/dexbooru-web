import prisma from '$lib/server/db/prisma';
import logger from '$lib/server/logging/logger';
import {
	SAUCENAO_ATTEMPT_TIMEOUT_MS,
	SAUCENAO_BACKOFF_BASE_MS,
	SAUCENAO_BACKOFF_CAP_MS,
	SAUCENAO_MAX_ATTEMPTS,
} from '$lib/server/constants/sauceNao';
import {
	DEFAULT_SAUCENAO_ENABLED_INDEX_IDS,
	SAUCENAO_INDEX_DETAILS_URL,
	SAUCENAO_INDEX_SOURCE_TYPE_HINTS,
} from '$lib/shared/constants/sauceNao';
import { fullJitterBackoffMs, sleep } from '$lib/shared/helpers/async';

const MINIMUM_PARSED_INDEX_ROWS = 10;
const HEX_MASK = /^0x[0-9a-fA-F]+$/;
const INDEX_ID = /^#(\d+)$/;

export type TSauceNaoIndexDetails = {
	id: number;
	maskBit: number;
	name: string;
	available: boolean;
};

// Index #17 is reserved and has no mask, so later ids are not their own bit positions.
const maskBitOf = (mask: bigint): number | null => {
	if (mask <= 0n || (mask & (mask - 1n)) !== 0n) return null;
	let bit = 0;
	let rest = mask;
	while (rest > 1n) {
		rest >>= 1n;
		bit += 1;
	}
	return bit;
};

export const parseSauceNaoIndexDetails = (text: string): TSauceNaoIndexDetails[] => {
	const rows: TSauceNaoIndexDetails[] = [];
	for (const line of text.split(/\r?\n/)) {
		const fields = line
			.split('\t')
			.map((field) => field.trim())
			.filter((field) => field.length > 0);
		const maskText = fields[0];
		const indexText = fields[1];
		const nameText = fields.at(-1);
		if (!maskText || !indexText || !nameText || fields.length < 3) continue;
		if (!HEX_MASK.test(maskText)) continue;
		const indexMatch = INDEX_ID.exec(indexText);
		if (!indexMatch?.[1]) continue;
		const maskBit = maskBitOf(BigInt(maskText));
		if (maskBit === null) continue;
		const disabled = nameText.endsWith('*');
		const name = disabled ? nameText.slice(0, -1) : nameText;
		if (name.length === 0) continue;
		rows.push({
			id: Number(indexMatch[1]),
			maskBit,
			name,
			available: !disabled,
		});
	}
	return rows;
};

export type TSyncSauceNaoIndexCatalogOptions = {
	fetch?: typeof fetch;
	now?: () => Date;
	sleep?: (milliseconds: number) => Promise<void>;
	random?: () => number;
};

const readIndexDetails = async (options: TSyncSauceNaoIndexCatalogOptions) => {
	const fetchImpl = options.fetch ?? fetch;
	const sleepImpl = options.sleep ?? sleep;
	const random = options.random ?? Math.random;
	for (let attempt = 0; attempt < SAUCENAO_MAX_ATTEMPTS; attempt += 1) {
		if (attempt > 0) {
			await sleepImpl(
				fullJitterBackoffMs({
					retryIndex: attempt - 1,
					baseMs: SAUCENAO_BACKOFF_BASE_MS,
					capMs: SAUCENAO_BACKOFF_CAP_MS,
					random,
				}),
			);
		}
		try {
			const response = await fetchImpl(SAUCENAO_INDEX_DETAILS_URL, {
				signal: AbortSignal.timeout(SAUCENAO_ATTEMPT_TIMEOUT_MS),
			});
			if (!response.ok) {
				throw new Error(`SauceNAO index details responded ${response.status}.`);
			}
			return await response.text();
		} catch (error) {
			if (attempt === SAUCENAO_MAX_ATTEMPTS - 1) {
				logger.error('Could not fetch SauceNAO index details.', error);
				return null;
			}
		}
	}
	return null;
};

export const syncSauceNaoIndexCatalog = async (options: TSyncSauceNaoIndexCatalogOptions = {}) => {
	const text = await readIndexDetails(options);
	if (text === null) return;
	const rows = parseSauceNaoIndexDetails(text);
	if (rows.length < MINIMUM_PARSED_INDEX_ROWS) {
		logger.error('SauceNAO index details changed format. Leaving the catalog unchanged.');
		return;
	}

	const syncedAt = (options.now ?? (() => new Date()))();
	// Update omits `enabled`, so a second sync cannot undo the owner's choice.
	await prisma.$transaction(async (tx) => {
		for (const row of rows) {
			await tx.sauceNaoIndex.upsert({
				where: { id: row.id },
				create: {
					id: row.id,
					maskBit: row.maskBit,
					name: row.name,
					available: row.available,
					enabled: DEFAULT_SAUCENAO_ENABLED_INDEX_IDS.includes(row.id),
					sourceType: SAUCENAO_INDEX_SOURCE_TYPE_HINTS.get(row.id) ?? null,
					lastSyncedAt: syncedAt,
				},
				update: {
					maskBit: row.maskBit,
					name: row.name,
					available: row.available,
					lastSyncedAt: syncedAt,
				},
			});
		}
		await tx.sauceNaoIndex.updateMany({
			where: { id: { notIn: rows.map((row) => row.id) } },
			data: { available: false },
		});
	});
};
