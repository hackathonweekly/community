import { normalizeSubmissionFormConfig } from "../../utils";

describe("normalizeSubmissionFormConfig", () => {
	test("returns null when config is missing or invalid", () => {
		expect(normalizeSubmissionFormConfig(null)).toBeNull();
		expect(normalizeSubmissionFormConfig(undefined)).toBeNull();
		expect(normalizeSubmissionFormConfig("nope")).toBeNull();
	});

	test("keeps baseFields when at least one config value is present", () => {
		const result = normalizeSubmissionFormConfig({
			baseFields: {
				tagline: {
					label: "  简介  ",
					required: true,
				},
				attachments: {
					enabled: false,
				},
			},
		});

		expect(result).toEqual({
			baseFields: {
				tagline: {
					label: "简介",
					required: true,
				},
				attachments: {
					enabled: false,
				},
			},
		});
	});

	test("drops empty baseFields objects", () => {
		const result = normalizeSubmissionFormConfig({
			baseFields: {
				tagline: {},
				demoUrl: {
					label: "   ",
				},
			},
		});

		expect(result).toBeNull();
	});

	test("drops invalid baseFields values", () => {
		const result = normalizeSubmissionFormConfig({
			baseFields: {
				tagline: {
					required: "true",
				},
				attachments: "nope",
			},
		});

		expect(result).toBeNull();
	});
});
