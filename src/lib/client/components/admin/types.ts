import type { TNumericApplicationConfigurationKey } from '$lib/shared/applicationConfiguration';

export type TField = {
	key: TNumericApplicationConfigurationKey;
	label: string;
	step?: number;
};

export type TNumericSection = {
	kind: 'numeric';
	name: string;
	tabLabel?: string;
	fields: TField[];
};

export type TSauceNaoSection = {
	kind: 'sauceNao';
	name: string;
	enabledIndexesKey: 'sauceNaoEnabledIndexes';
	minimumSimilarity: TField;
};

export type TSection = TNumericSection | TSauceNaoSection;
