/**
 * Utility functions for parsing registration errors
 */

export const getFirstErrorMessage = (value: unknown): string | null => {
	if (!value) return null;
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	if (Array.isArray(value)) {
		for (const item of value) {
			const message = getFirstErrorMessage(item);
			if (message) {
				return message;
			}
		}
		return null;
	}
	if (typeof value === "object") {
		const record = value as Record<string, unknown>;
		for (const key of ["message", "error", "detail"]) {
			if (key in record) {
				const nestedMessage = getFirstErrorMessage(record[key]);
				if (nestedMessage) {
					return nestedMessage;
				}
			}
		}
	}
	return null;
};

export const parseRegistrationError = async (
	response: Response,
	fallbackMessage: string,
): Promise<string> => {
	try {
		const errorData = await response.json();
		const parsed = getFirstErrorMessage(errorData);
		if (parsed) {
			return parsed;
		}
	} catch {
		// Ignore JSON parsing errors and fall back to status text/default message
	}
	const statusMessage = response.statusText?.trim();
	if (statusMessage) {
		return statusMessage;
	}
	return fallbackMessage;
};

export const parseRegistrationErrorPayload = async (
	response: Response,
	fallbackMessage: string,
): Promise<{ message: string; code?: string }> => {
	try {
		const errorData = await response.json();
		const parsed = getFirstErrorMessage(errorData);
		const statusMessage = response.statusText?.trim();
		const message = parsed || statusMessage || fallbackMessage;
		const code =
			errorData && typeof errorData === "object" && "code" in errorData
				? (errorData as { code?: string }).code
				: undefined;
		return { message, code };
	} catch {
		const statusMessage = response.statusText?.trim();
		return { message: statusMessage || fallbackMessage };
	}
};

export const resolveRegistrationErrorMessage = (
	error: unknown,
	fallbackMessage: string,
): string => {
	if (error instanceof Error) {
		const message = error.message.trim();
		return message ? message : fallbackMessage;
	}
	if (typeof error === "string") {
		const trimmed = error.trim();
		return trimmed ? trimmed : fallbackMessage;
	}
	return fallbackMessage;
};
