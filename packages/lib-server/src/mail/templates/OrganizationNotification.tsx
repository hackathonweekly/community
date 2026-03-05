import { Heading, Text, Hr } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import Wrapper from "../components/Wrapper";
import { defaultLocale } from "../translations";
import { defaultTranslations } from "../translations";
import type { BaseMailProps } from "../types";

export function OrganizationNotification({
	organizationName,
	organizationLogo,
	subject,
	content,
	type,
	locale,
	translations,
}: {
	organizationName: string;
	organizationLogo?: string;
	subject: string;
	content: string;
	type: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "announcement":
				return "📢";
			case "event":
				return "🎉";
			case "update":
				return "📝";
			default:
				return "📧";
		}
	};

	return (
		<Wrapper>
			<Heading className="text-xl mb-4">
				{getTypeIcon(type)} {organizationName}
			</Heading>

			<Heading className="text-lg mb-4">{subject}</Heading>

			<Hr className="my-4" />

			<div
				dangerouslySetInnerHTML={{ __html: content }}
				style={{
					lineHeight: 1.6,
					fontSize: "16px",
					color: "#374151",
				}}
			/>

			<Hr className="my-6" />

			<Text className="text-sm text-muted-foreground">
				这封邮件来自 {organizationName}
				。如果您不希望接收此类邮件，请联系组织管理员。
			</Text>
		</Wrapper>
	);
}

OrganizationNotification.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	organizationName: "HackathonWeekly",
	subject: "重要通知",
	content: "这是一个测试通知内容。<br><br>感谢您对我们组织的支持！",
	type: "announcement",
};

export default OrganizationNotification;
