import { Heading, Text, Hr, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";
import Wrapper from "../components/Wrapper";
import { defaultLocale } from "../translations";
import { defaultTranslations } from "../translations";
import type { BaseMailProps } from "../types";

export function OrganizationApplicationRejected({
	organizationName,
	organizationUrl,
	applicantName,
	reviewNote,
	locale = defaultLocale,
	translations = defaultTranslations,
}: {
	organizationName: string;
	organizationUrl: string;
	applicantName: string;
	reviewNote?: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

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
					关于您的组织申请
				</Heading>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section style={{ marginBottom: 24 }}>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{applicantName}，感谢您对{" "}
					<strong>{organizationName}</strong> 的关注。
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					很遗憾，您的加入申请暂时未能通过审核。这可能是由于组织当前的成员需求、
					技能匹配度或其他因素导致的。
				</Text>

				{reviewNote && (
					<Text
						style={{
							fontSize: 15,
							lineHeight: 1.7,
							color: "#333",
							margin: "0 0 12px",
							padding: 12,
							background: "#f0f9ff",
							borderRadius: 8,
						}}
					>
						📝 管理员留言：{reviewNote}
					</Text>
				)}

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					再次感谢您的申请，祝您在社区中找到合适的发展机会！
				</Text>

				<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
					<a
						href={organizationUrl}
						style={{
							color: "#000",
							textDecoration: "underline",
							fontWeight: 500,
						}}
					>
						了解更多组织信息
					</a>
				</Text>
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

export default OrganizationApplicationRejected;
