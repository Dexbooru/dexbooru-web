/**
 * Uses browser-native SubtleCrypto to calculate SHA-256 hash.
 * This avoids manual implementation of hashing algorithms.
 */
export async function calculateHash(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}
