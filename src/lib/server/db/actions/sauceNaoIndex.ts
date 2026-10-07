import prisma from '$lib/server/db/prisma';
import type { TSauceNaoIndex } from '$lib/shared/types/sauceNao';

const SAUCE_NAO_INDEX_SELECT = {
	id: true,
	maskBit: true,
	name: true,
	available: true,
	enabled: true,
	sourceType: true,
} as const;

export const listAvailableSauceNaoIndexes = async (): Promise<TSauceNaoIndex[]> => {
	return await prisma.sauceNaoIndex.findMany({
		where: { available: true },
		orderBy: { id: 'asc' },
		select: SAUCE_NAO_INDEX_SELECT,
	});
};

export const listEnabledSauceNaoIndexes = async (): Promise<TSauceNaoIndex[]> => {
	return await prisma.sauceNaoIndex.findMany({
		where: { available: true, enabled: true },
		orderBy: { id: 'asc' },
		select: SAUCE_NAO_INDEX_SELECT,
	});
};

export const setEnabledSauceNaoIndexIds = async (enabledIndexIds: readonly number[]) => {
	await prisma.$transaction(async (tx) => {
		await tx.sauceNaoIndex.updateMany({
			where: {
				available: true,
				...(enabledIndexIds.length > 0 ? { id: { notIn: [...enabledIndexIds] } } : {}),
			},
			data: { enabled: false },
		});
		if (enabledIndexIds.length === 0) return;
		await tx.sauceNaoIndex.updateMany({
			where: { available: true, id: { in: [...enabledIndexIds] } },
			data: { enabled: true },
		});
	});
};
