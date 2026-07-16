export const DEFAULT_MAX_UPLOAD_SIZE = 200 * 1024 * 1024;

export const resolveMaxUploadSize = (configuredValue?: string): number => {
	if (!configuredValue) return DEFAULT_MAX_UPLOAD_SIZE;

	const parsed = Number(configuredValue);
	return Number.isSafeInteger(parsed) && parsed > 0
		? parsed
		: DEFAULT_MAX_UPLOAD_SIZE;
};

export const isUploadSizeAllowed = (
	fileSize: number,
	maxUploadSize: number,
): boolean =>
	Number.isSafeInteger(fileSize) && fileSize > 0 && fileSize <= maxUploadSize;
