export function normalizeCount(count: number): string {
	if (count >= 1000000) {
		return (count / 1000000).toFixed(1) + 'M';
	}

	if (count >= 1000) {
		return (count / 1000).toFixed(1) + 'K';
	}

	return count.toString();
}

export function formatNumberWithCommas(target: number): string {
    return target.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}