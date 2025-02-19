-- Add searchable generated columns with the ts_vector API on the textual columns required for full text search
ALTER TABLE "User"
ADD COLUMN searchable tsvector
    GENERATED ALWAYS AS (to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(id, ''))) STORED;

ALTER TABLE "Post"
ADD COLUMN searchable tsvector
    GENERATED ALWAYS AS (to_tsvector('english', 
                            COALESCE(description, '') || ' ' || 
                            COALESCE('Post.tagString', '') || ' ' ||
                            COALESCE('Post.artistString', '') || ' ' ||
                            COALESCE('Post.authorId', ''))) STORED;

ALTER TABLE "Tag"
ADD COLUMN searchable tsvector
    GENERATED ALWAYS AS (to_tsvector('english', COALESCE(name, ''))) STORED;

ALTER TABLE "Artist"
ADD COLUMN searchable tsvector
    GENERATED ALWAYS AS (to_tsvector('english', COALESCE(name, ''))) STORED;

ALTER TABLE "PostCollection"
ADD COLUMN searchable tsvector
    GENERATED ALWAYS AS (to_tsvector('english', COALESCE(title, '') || ' ' || 
                            COALESCE(description, '') || ' ' || COALESCE(id, ''))) STORED;

-- Add GIN indexing on the searchable columns
CREATE INDEX user_searchable_idx ON "User" USING GIN(searchable);
CREATE INDEX post_searchable_idx ON "Post" USING GIN(searchable);
CREATE INDEX tag_searchable_idx ON "Tag" USING GIN(searchable);
CREATE INDEX artist_searchable_idx ON "Artist" USING GIN(searchable);
CREATE INDEX collection_searchable_idx ON "PostCollection" USING GIN(searchable);