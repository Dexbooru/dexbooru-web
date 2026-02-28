import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../html';

describe('escapeHtml', () => {
	it('should escape ampersand', () => {
		expect(escapeHtml('a&b')).toBe('a&amp;b');
	});

	it('should escape less-than', () => {
		expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
	});

	it('should escape greater-than', () => {
		expect(escapeHtml('>')).toBe('&gt;');
	});

	it('should escape double quote', () => {
		expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
	});

	it('should escape single quote', () => {
		expect(escapeHtml("it's")).toBe('it&#39;s');
	});

	it('should escape multiple special characters', () => {
		expect(escapeHtml('<img src="x" onerror="alert(1)">')).toBe(
			'&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;',
		);
	});

	it('should return safe strings unchanged', () => {
		expect(escapeHtml('alice123')).toBe('alice123');
		expect(escapeHtml('user_name')).toBe('user_name');
	});

	it('should handle empty string', () => {
		expect(escapeHtml('')).toBe('');
	});
});
