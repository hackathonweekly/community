import { type TranslationValues, useTranslations } from "next-intl";
import { ZodIssueCode } from "zod";
import type { ZodErrorMap } from "zod";

/**
 * This error map is a modified version of the one used by zod-i18n
 * Checkout the original at: https://github.com/aiji42/zod-i18n
 *
 * Updated for Zod 4 API compatibility.
 */

function joinValues<T extends unknown[]>(array: T, separator = " | "): string {
	return array
		.map((val) => (typeof val === "string" ? `'${val}'` : val))
		.join(separator);
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	for (const key in value) {
		if (!Object.prototype.hasOwnProperty.call(value, key)) {
			return false;
		}
	}

	return true;
};

const getKeyAndValues = (
	param: unknown,
	defaultKey: string,
): {
	values: Record<string, unknown>;
	key: string;
} => {
	if (typeof param === "string") {
		return { key: param, values: {} };
	}

	if (isRecord(param)) {
		const key =
			"key" in param && typeof param.key === "string"
				? param.key
				: defaultKey;
		const values =
			"values" in param && isRecord(param.values) ? param.values : {};
		return { key, values };
	}

	return { key: defaultKey, values: {} };
};

export function useFormErrors() {
	const t = useTranslations();

	type TranslationKey = Parameters<typeof t>[0];

	const zodErrorMap: ZodErrorMap = (issue) => {
		let message: string | undefined;

		switch (issue.code) {
			case ZodIssueCode.invalid_type:
				if (issue.expected) {
					message = t("zod.errors.invalid_type", {
						expected: t(
							`zod.types.${issue.expected}` as TranslationKey,
						),
					});
				}
				break;
			case ZodIssueCode.invalid_value:
				if ("values" in issue && Array.isArray(issue.values)) {
					message = t("zod.errors.invalid_enum_value", {
						options: joinValues(issue.values),
					});
				}
				break;
			case ZodIssueCode.unrecognized_keys:
				if ("keys" in issue && Array.isArray(issue.keys)) {
					message = t("zod.errors.unrecognized_keys", {
						keys: joinValues(issue.keys, ", "),
						count: issue.keys.length,
					});
				}
				break;
			case ZodIssueCode.invalid_union:
				message = t("zod.errors.invalid_union");
				break;
			case ZodIssueCode.invalid_format:
				if ("format" in issue && typeof issue.format === "string") {
					message = t(
						`zod.errors.invalid_string.${issue.format}` as TranslationKey,
						{
							validation: t(
								`zod.validations.${issue.format}` as TranslationKey,
							),
						},
					);
				}
				break;
			case ZodIssueCode.too_small: {
				const minimum =
					"minimum" in issue ? (issue.minimum as number) : undefined;
				if (minimum !== undefined) {
					const type =
						"type" in issue ? (issue.type as string) : "number";
					const inclusive =
						"inclusive" in issue ? issue.inclusive : true;
					const exact = "exact" in issue ? issue.exact : false;
					message = t(
						`zod.errors.too_small.${type}.${
							exact
								? "exact"
								: inclusive
									? "inclusive"
									: "not_inclusive"
						}` as TranslationKey,
						{
							minimum,
							count: typeof minimum === "number" ? minimum : "",
						},
					);
				}
				break;
			}
			case ZodIssueCode.too_big: {
				const maximum =
					"maximum" in issue ? (issue.maximum as number) : undefined;
				if (maximum !== undefined) {
					const type =
						"type" in issue ? (issue.type as string) : "number";
					const inclusive =
						"inclusive" in issue ? issue.inclusive : true;
					const exact = "exact" in issue ? issue.exact : false;
					message = t(
						`zod.errors.too_big.${type}.${
							exact
								? "exact"
								: inclusive
									? "inclusive"
									: "not_inclusive"
						}` as TranslationKey,
						{
							maximum,
							count: typeof maximum === "number" ? maximum : "",
						},
					);
				}
				break;
			}
			case ZodIssueCode.custom: {
				const { key, values } = getKeyAndValues(
					"params" in issue
						? (issue.params as Record<string, unknown>)?.i18n
						: undefined,
					"zod.errors.custom",
				);

				message = t(
					`zod.errors.custom.${key}` as Parameters<typeof t>[0],
					(values as TranslationValues) ?? {},
				);
				break;
			}
			case ZodIssueCode.not_multiple_of:
				message = t("zod.errors.not_multiple_of");
				break;
			default:
		}

		return message;
	};

	return {
		zodErrorMap,
	};
}
