import { getApiAuthHeaders } from '../helpers/auth';

export type TReportClientApiConfig = {
	createPath: (targetId: string) => string;
	getByTargetPath: (targetId: string) => string;
	deletePath: (targetId: string, reportId: string) => string;
	listGeneralPath: (pageNumber: number) => string;
};

export function createReportClientApi<TCategory extends string>(config: TReportClientApiConfig) {
	const createReport = async (
		targetId: string,
		reportReasonCategory: TCategory,
		description: string,
	) => {
		return await fetch(config.createPath(targetId), {
			method: 'POST',
			body: JSON.stringify({ category: reportReasonCategory, description }),
		});
	};

	const getReportsByTarget = async (targetId: string) => {
		return await fetch(config.getByTargetPath(targetId), {
			headers: getApiAuthHeaders(),
			method: 'GET',
		});
	};

	const deleteReport = async (targetId: string, reportId: string) => {
		return await fetch(config.deletePath(targetId, reportId), {
			headers: getApiAuthHeaders(),
			method: 'DELETE',
		});
	};

	const getReportsGeneral = async (pageNumber: number) => {
		return await fetch(config.listGeneralPath(pageNumber), {
			headers: getApiAuthHeaders(),
			method: 'GET',
		});
	};

	return {
		createReport,
		getReportsByTarget,
		deleteReport,
		getReportsGeneral,
	};
}
