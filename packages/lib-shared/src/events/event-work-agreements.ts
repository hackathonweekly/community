const normalizeOptionalMarkdown = (value: unknown): string | null => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
};

export const DEFAULT_PARTICIPATION_AGREEMENT_MARKDOWN = `# 参赛协议

报名参加本活动即表示你已阅读并同意以下条款：

1. 你提交的报名信息真实、准确，并愿意遵守活动规则与组织方安排。
2. 活动期间请遵守社区行为准则与相关法律法规，不发布或传播违法违规内容。
3. 你理解并接受活动组织方在合理范围内对活动流程与规则进行必要调整。

如对协议内容有疑问，请联系活动主办方/组织者。
`;

export const DEFAULT_WORK_AUTHORIZATION_AGREEMENT_MARKDOWN = `# 作品授权协议

提交作品即表示你确认：

1. 你对所提交的作品内容拥有相应权利或已获得必要授权，不侵犯任何第三方权益。
2. 若你选择“同意授权”，你授权社区在与本活动相关的展示、投票、评选、宣传等场景中使用你的作品信息（包括但不限于作品名称、简介、图片/附件等），以便进行公开展示与传播。
3. 若你选择“暂不同意”，你的作品仍可提交，但将不参与公开展示、投票及评选，仅对提交者与活动组织者/管理员可见。

如对授权范围或使用方式有疑问，请联系活动主办方/组织者。
`;

export const resolveParticipationAgreementMarkdown = (
	registrationFieldConfig: unknown,
): string => {
	if (
		registrationFieldConfig &&
		typeof registrationFieldConfig === "object" &&
		!Array.isArray(registrationFieldConfig)
	) {
		const override = normalizeOptionalMarkdown(
			(registrationFieldConfig as Record<string, unknown>)
				.participationAgreementMarkdown,
		);
		if (override) return override;
	}
	return DEFAULT_PARTICIPATION_AGREEMENT_MARKDOWN;
};

export const resolveWorkAuthorizationAgreementMarkdown = (
	submissionFormConfig: unknown,
): string => {
	if (
		submissionFormConfig &&
		typeof submissionFormConfig === "object" &&
		!Array.isArray(submissionFormConfig)
	) {
		const maybeSettings = (submissionFormConfig as Record<string, unknown>)
			.settings;
		if (
			maybeSettings &&
			typeof maybeSettings === "object" &&
			!Array.isArray(maybeSettings)
		) {
			const override = normalizeOptionalMarkdown(
				(maybeSettings as Record<string, unknown>)
					.workAuthorizationAgreementMarkdown,
			);
			if (override) return override;
		}
	}
	return DEFAULT_WORK_AUTHORIZATION_AGREEMENT_MARKDOWN;
};
