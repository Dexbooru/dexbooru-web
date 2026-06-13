import { SEARCHABLE_DEPENDENT_COLUMNS } from '$lib/shared/applicationConfiguration/varcharSync';

type TSearchableTableConfig = {
	indexName: string;
	expression: string;
	dependentColumns: readonly string[];
};

export const SEARCHABLE_TABLE_CONFIG: Record<string, TSearchableTableConfig> = {
	User: {
		indexName: 'user_searchable_idx',
		expression: "to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(id, ''))",
		dependentColumns: SEARCHABLE_DEPENDENT_COLUMNS.User,
	},
	Post: {
		indexName: 'post_searchable_idx',
		expression:
			"to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE('Post.tagString', '') || ' ' || COALESCE('Post.artistString', '') || ' ' || COALESCE('Post.authorId', ''))",
		dependentColumns: SEARCHABLE_DEPENDENT_COLUMNS.Post,
	},
	Tag: {
		indexName: 'tag_searchable_idx',
		expression: "to_tsvector('english', COALESCE(name, ''))",
		dependentColumns: SEARCHABLE_DEPENDENT_COLUMNS.Tag,
	},
	Artist: {
		indexName: 'artist_searchable_idx',
		expression: "to_tsvector('english', COALESCE(name, ''))",
		dependentColumns: SEARCHABLE_DEPENDENT_COLUMNS.Artist,
	},
	PostCollection: {
		indexName: 'collection_searchable_idx',
		expression:
			"to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(id, ''))",
		dependentColumns: SEARCHABLE_DEPENDENT_COLUMNS.PostCollection,
	},
};

export const tableRequiresSearchableRebuild = (
	table: string,
	columns: Iterable<string>,
): boolean => {
	const searchableConfig = SEARCHABLE_TABLE_CONFIG[table];
	if (!searchableConfig) return false;

	const dependentColumns = new Set(searchableConfig.dependentColumns);
	for (const column of columns) {
		if (dependentColumns.has(column)) return true;
	}
	return false;
};
