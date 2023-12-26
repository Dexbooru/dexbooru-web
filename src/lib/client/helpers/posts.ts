export function normalizeLikes(likes: number): string {
	if (likes >= 1000000) {
		return (likes / 1000000).toFixed(1) + 'M';
	}

	if (likes >= 1000) {
		return (likes / 1000).toFixed(1) + 'K';
	}

	return likes.toString();
}
