import type { SubmissionFormConfig } from "@/features/event-submissions/types";
import type { EventFormData } from "../components/types";

export function normalizeSubmissionFormConfig(
	config?: SubmissionFormConfig | null,
): EventFormData["submissionFormConfig"] {
	if (!config) return null;

	const baseFields = config.baseFields
		? {
				...(config.baseFields.tagline && {
					tagline: {
						...config.baseFields.tagline,
					},
				}),
				...(config.baseFields.demoUrl && {
					demoUrl: {
						...config.baseFields.demoUrl,
					},
				}),
				...(config.baseFields.attachments && {
					attachments: {
						...config.baseFields.attachments,
					},
				}),
			}
		: undefined;

	const fields =
		config.fields?.map((field, index) => ({
			...field,
			enabled: field.enabled ?? true,
			publicVisible: field.publicVisible ?? true,
			order: typeof field.order === "number" ? field.order : index,
		})) ?? [];

	const settings = config.settings
		? {
				attachmentsEnabled: config.settings.attachmentsEnabled ?? true,
				communityUseAuthorizationEnabled:
					config.settings.communityUseAuthorizationEnabled ?? true,
				...(typeof config.settings
					.workAuthorizationAgreementMarkdown === "string" &&
				config.settings.workAuthorizationAgreementMarkdown.trim()
					? {
							workAuthorizationAgreementMarkdown:
								config.settings.workAuthorizationAgreementMarkdown.trim(),
						}
					: {}),
			}
		: undefined;

	const hasBaseFields = Boolean(
		baseFields &&
			(baseFields.tagline ||
				baseFields.demoUrl ||
				baseFields.attachments),
	);

	if (!fields.length && !settings && !hasBaseFields) {
		return null;
	}

	return {
		...(fields.length ? { fields } : { fields: [] }),
		...(hasBaseFields ? { baseFields } : {}),
		...(settings ? { settings } : {}),
	};
}
