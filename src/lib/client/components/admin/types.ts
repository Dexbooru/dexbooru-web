import type { TApplicationConfigurationKey } from '$lib/shared/applicationConfiguration';

export type TField = {
	key: TApplicationConfigurationKey;
	label: string;
	step?: number;
};

export type TSection = {
	name: string;
	fields: TField[];
};
