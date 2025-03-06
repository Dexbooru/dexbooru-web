import {
	REPORT_POST_COLLECTION_REASON_CATEGORIES,
	REPORT_POST_REASON_CATEGORIES,
	REPORT_USER_REASON_CATEGORIES,
} from '$lib/shared/constants/reports';
import { createPostCollectionReport, getPostCollectionReports } from '../api/collectionReports';
import { createPostReport, getPostReports } from '../api/postReports';
import { createUserReport, getUserReports } from '../api/userReports';
import {
	REPORT_MODAL_NAME,
	REPORT_POST_COLLECTION_LIST_MODAL_NAME,
	REPORT_POST_COLLECTION_MODAL_NAME,
	REPORT_POST_LIST_MODAL_NAME,
	REPORT_USER_LIST_MODAL_NAME,
	REPORT_USER_MODAL_NAME,
} from './layout';

export const REPORT_TYPE_TO_MODAL_CONFIG_KEY = {
	postReports: 'post',
	postCollectionReports: 'collection',
	userReports: 'user',
};

export const REPORT_MODAL_CONFIG = {
	post: {
		modalName: REPORT_MODAL_NAME,
		reportCategories: REPORT_POST_REASON_CATEGORIES,
		apiFunction: createPostReport,
	},
	collection: {
		modalName: REPORT_POST_COLLECTION_MODAL_NAME,
		reportCategories: REPORT_POST_COLLECTION_REASON_CATEGORIES,
		apiFunction: createPostCollectionReport,
	},
	user: {
		modalName: REPORT_USER_MODAL_NAME,
		reportCategories: REPORT_USER_REASON_CATEGORIES,
		apiFunction: createUserReport,
	},
};

export const REPORT_MODAL_LIST_CONFIG = {
	post: {
		modalName: REPORT_POST_LIST_MODAL_NAME,
		apiFunction: getPostReports,
	},
	collection: {
		modalName: REPORT_POST_COLLECTION_LIST_MODAL_NAME,
		apiFunction: getPostCollectionReports,
	},
	user: {
		modalName: REPORT_USER_LIST_MODAL_NAME,
		apiFunction: getUserReports,
	},
};
