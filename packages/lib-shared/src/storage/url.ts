import { config } from "@community/config";

const isAbsoluteUrl = (value: string) =>
	/^https?:\/\//i.test(value) ||
	value.startsWith("//") ||
	value.startsWith("data:");

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

export function getPublicStorageUrl(
	value: string | null | undefined,
): string | null {
	if (!value) {
		return null;
	}

	if (isAbsoluteUrl(value)) {
		return value;
	}

	const endpoint = config.storage.endpoints.public;

	if (!endpoint) {
		return value;
	}

	const normalizedEndpoint = endpoint.replace(/\/+$/, "");
	const normalizedValue = trimSlashes(value);

	return `${normalizedEndpoint}/${normalizedValue}`;
}

export function mapPublicStorageUrls<T extends Record<string, any>>(
	record: T,
	keys: Array<keyof T>,
): T {
	const result = { ...record } as T;

	for (const key of keys) {
		const currentValue = result[key];
		result[key] = getPublicStorageUrl(
			currentValue as string | null | undefined,
		) as T[typeof key];
	}

	return result;
}

const ORGANIZATION_STORAGE_KEYS = [
	"logo",
	"coverImage",
	"audienceQrCode",
	"memberQrCode",
] as const;

export function withOrganizationPublicUrls<T extends Record<string, any>>(
	organization: T,
): T {
	const keys = ORGANIZATION_STORAGE_KEYS.filter((key) => key in organization);
	return mapPublicStorageUrls(organization, keys as Array<keyof T>);
}
