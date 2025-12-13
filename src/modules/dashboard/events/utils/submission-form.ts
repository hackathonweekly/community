import type { SubmissionFormConfig } from "@/features/event-submissions/types";
import type { EventFormData } from "../components/types";

export function normalizeSubmissionFormConfig(
	config?: SubmissionFormConfig | null,
): EventFormData["submissionFormConfig"] {
	if (!config) return null;

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
			}
		: undefined;

	if (!fields.length && !settings) {
		return null;
	}

	return {
		...(fields.length ? { fields } : { fields: [] }),
		...(settings ? { settings } : {}),
	};
}
