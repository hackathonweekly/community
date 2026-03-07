import { Heading, Text, Hr, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";
import Wrapper from "../components/Wrapper";
import { defaultLocale } from "../translations";
import { defaultTranslations } from "../translations";
import type { BaseMailProps } from "../types";

export function OrganizationApplicationReceived({
	organizationName,
	applicantName,
	applicantEmail,
	reason,
	dashboardUrl,
	locale = defaultLocale,
	translations = defaultTranslations,
}: {
	organizationName: string;
	applicantName: string;
	applicantEmail: string;
	reason: string;
	dashboardUrl: string;
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
					新的组织加入申请
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
					您好，您的组织 <strong>{organizationName}</strong>{" "}
					收到了一份新的加入申请。
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 8px",
					}}
				>
					<strong>申请人信息：</strong>
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 4px",
					}}
				>
					姓名：{applicantName}
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 8px",
					}}
				>
					邮箱：{applicantEmail}
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 4px",
					}}
				>
					<strong>申请理由：</strong>
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
						padding: 12,
						background: "#f9fafb",
						borderRadius: 8,
					}}
				>
					{reason}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					请及时查看申请并做出审核决定。申请人正在等待您的回复。
				</Text>

				<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
					<a
						href={dashboardUrl}
						style={{
							color: "#000",
							textDecoration: "underline",
							fontWeight: 500,
						}}
					>
						查看申请详情
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

export default OrganizationApplicationReceived;
