import { Heading, Text, Hr, Section } from "@react-email/components";
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
			<Section style={{ marginBottom: 24 }}>
				<Text
					style={{
						fontSize: 13,
						color: "#999",
						margin: "0 0 20px",
						textAlign: "center",
					}}
				>
					{locale === "zh"
						? "周周黑客松 HackathonWeekly"
						: "HackathonWeekly"}
				</Text>

				<Heading
					style={{
						fontSize: 22,
						fontWeight: 600,
						margin: "0 0 12px",
						color: "#000",
						lineHeight: 1.4,
					}}
				>
					{getTypeIcon(type)} {subject}
				</Heading>

				<Text style={{ fontSize: 13, color: "#999", margin: 0 }}>
					{organizationName}
				</Text>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section style={{ marginBottom: 24 }}>
				<div
					dangerouslySetInnerHTML={{ __html: content }}
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
					}}
				/>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section>
				<Text style={{ fontSize: 12, color: "#999", margin: 0 }}>
					© {new Date().getFullYear()} HackathonWeekly Team
				</Text>
			</Section>
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
