export function getFormFields<T>(formData: FormData): T {
	const fields: T = {} as T;

	for (const [key, value] of formData.entries()) {
		fields[key as keyof T] = value as T[keyof T];
	}

	return fields;
}
