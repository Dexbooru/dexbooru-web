-- Alter table
ALTER TABLE "Post"
ADD CONSTRAINT post_positive_value_check_likes CHECK ("likes" >= 0),
ADD CONSTRAINT post_positive_value_check_comment_count CHECK ("commentCount" >= 0);