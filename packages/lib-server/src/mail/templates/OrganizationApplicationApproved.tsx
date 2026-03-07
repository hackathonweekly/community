import { Heading, Text, Hr, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";
import Wrapper from "../components/Wrapper";
import { defaultLocale } from "../translations";
import { defaultTranslations } from "../translations";
import type { BaseMailProps } from "../types";

export function OrganizationApplicationApproved({
	organizationName,
	organizationUrl,
	applicantName,
	locale = defaultLocale,
	translations = defaultTranslations,
}: {
	organizationName: string;
	organizationUrl: string;
	applicantName: string;
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
					🎉 申请已通过！欢迎加入 {organizationName}
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
					{applicantName}，恭喜您！
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					您申请加入 <strong>{organizationName}</strong>{" "}
					的申请已经通过审核。
					现在您已经是该组织的正式成员，可以参与组织的各项活动和交流。
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					感谢您的耐心等待，期待您在组织中的积极参与！
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
						访问组织主页
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

export default OrganizationApplicationApproved;
