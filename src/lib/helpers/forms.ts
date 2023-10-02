export function getFormFields<T>(formData: FormData, getAllFields: (keyof T)[] = []): T {
	const fields = {} as Record<keyof T, T[keyof T] | T[keyof T][]>;

	for (const [key, value] of formData.entries()) {
		if (getAllFields.includes(key as keyof T)) {
			if (!fields[key as keyof T]) {
				fields[key as keyof T] = [] as T[keyof T][];
			}

			if (Array.isArray(fields[key as keyof T])) {
				(fields[key as keyof T] as T[keyof T][]).push(value as T[keyof T]);
			}
		} else {
			fields[key as keyof T] = value as T[keyof T];
		}
	}

	return fields as T;
}
