import type {
	TApplicationConfiguration,
	TApplicationConfigurationKey,
	TApplicationConfigurationSectionKey,
} from './types';

type TVarcharFieldMapping = {
	type: 'varchar';
	configKey: TApplicationConfigurationKey;
	section: TApplicationConfigurationSectionKey;
	table: string;
	column: string;
	schemaFile: string;
};

type TComputedVarcharFieldMapping = {
	type: 'computed_varchar';
	configKey: TApplicationConfigurationKey;
	section: TApplicationConfigurationSectionKey;
	table: string;
	column: string;
	schemaFile: string;
	compute: (configuration: TApplicationConfiguration) => number;
};

export type TConfigurationSchemaFieldMapping = TVarcharFieldMapping | TComputedVarcharFieldMapping;

export const APPLICATION_CONFIGURATION_SECTIONS = [
	'labels',
	'posts',
	'images',
	'comments',
	'collections',
	'auth',
	'preferences',
	'reports',
	'pagination',
	'rateLimit',
] as const satisfies TApplicationConfigurationSectionKey[];

export const APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS: TConfigurationSchemaFieldMapping[] =
	[
		{
			type: 'varchar',
			configKey: 'maximumTagLength',
			section: 'labels',
			table: 'Tag',
			column: 'name',
			schemaFile: 'prisma/schema/tag.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumArtistLength',
			section: 'labels',
			table: 'Artist',
			column: 'name',
			schemaFile: 'prisma/schema/artist.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumTagDescriptionLength',
			section: 'labels',
			table: 'Tag',
			column: 'description',
			schemaFile: 'prisma/schema/tag.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumArtistDescriptionLength',
			section: 'labels',
			table: 'Artist',
			column: 'description',
			schemaFile: 'prisma/schema/artist.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumPostDescriptionLength',
			section: 'posts',
			table: 'Post',
			column: 'description',
			schemaFile: 'prisma/schema/post.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumSourceLinkLength',
			section: 'posts',
			table: 'Post',
			column: 'sourceLink',
			schemaFile: 'prisma/schema/post.prisma',
		},
		{
			type: 'computed_varchar',
			configKey: 'maximumTagsPerPost',
			section: 'posts',
			table: 'Post',
			column: 'tagString',
			schemaFile: 'prisma/schema/post.prisma',
			compute: (configuration) =>
				configuration.maximumTagLength * configuration.maximumTagsPerPost + 20,
		},
		{
			type: 'computed_varchar',
			configKey: 'maximumArtistsPerPost',
			section: 'posts',
			table: 'Post',
			column: 'artistString',
			schemaFile: 'prisma/schema/post.prisma',
			compute: (configuration) =>
				configuration.maximumArtistLength * configuration.maximumArtistsPerPost + 5,
		},
		{
			type: 'varchar',
			configKey: 'maximumCommentContentLength',
			section: 'comments',
			table: 'Comment',
			column: 'content',
			schemaFile: 'prisma/schema/comment.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumCollectionTitleLength',
			section: 'collections',
			table: 'PostCollection',
			column: 'title',
			schemaFile: 'prisma/schema/collection.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumCollectionDescriptionLength',
			section: 'collections',
			table: 'PostCollection',
			column: 'description',
			schemaFile: 'prisma/schema/collection.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumUsernameLength',
			section: 'auth',
			table: 'User',
			column: 'username',
			schemaFile: 'prisma/schema/user.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumReportReasonDescriptionLength',
			section: 'reports',
			table: 'PostReport',
			column: 'description',
			schemaFile: 'prisma/schema/post.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumReportReasonDescriptionLength',
			section: 'reports',
			table: 'PostCollectionReport',
			column: 'description',
			schemaFile: 'prisma/schema/collection.prisma',
		},
		{
			type: 'varchar',
			configKey: 'maximumReportReasonDescriptionLength',
			section: 'reports',
			table: 'UserReport',
			column: 'description',
			schemaFile: 'prisma/schema/user.prisma',
		},
	];

export const getMappedVarcharConstraint = (
	mapping: TConfigurationSchemaFieldMapping,
	configuration: TApplicationConfiguration,
) => {
	if (mapping.type === 'varchar') {
		return configuration[mapping.configKey];
	}
	return mapping.compute(configuration);
};
