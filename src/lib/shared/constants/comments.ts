export const MAXIMUM_CONTENT_LENGTH = 1500;
export const MAXIMUM_COMMENTS_PER_PAGE = 35;
export const COMMENT_TEXT_AREA_ROWS = 5;
export const URL_REGEX =
	/(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})? /g;
export const PARENT_COMMENT_ID_URL_PARAMETER = 'parentCommentId';
export const PAGE_NUMBER_URL_PARAMETER = 'pageNumber';
export const COMMENT_CONTENT_BODY_PARAMETER_NAME = 'content';