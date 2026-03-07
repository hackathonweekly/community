import Wrapper from "../components/Wrapper";
import { Text, Hr, Heading, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface WeeklyReportGlobalProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	weekRange: string;
	data: {
		newUsers: number;
		newOrganizations: number;
		totalEvents: number;
	};
	unsubscribeUrl: string;
}

export function WeeklyReportGlobal({
	locale,
	translations,
	weekRange,
	data,
	unsubscribeUrl,
}: WeeklyReportGlobalProps) {
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
					{t("mail.weeklyReport.global.title")}
				</Heading>

				<Text style={{ fontSize: 13, color: "#999", margin: 0 }}>
					{weekRange}
				</Text>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section style={{ marginBottom: 24 }}>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 8px",
					}}
				>
					<strong>📊 {t("mail.weeklyReport.global.overview")}</strong>
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 4px",
					}}
				>
					{t("mail.weeklyReport.global.newUsers")}: {data.newUsers}
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 4px",
					}}
				>
					{t("mail.weeklyReport.global.newOrganizations")}:{" "}
					{data.newOrganizations}
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{t("mail.weeklyReport.global.totalEvents")}:{" "}
					{data.totalEvents}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{t("mail.weeklyReport.global.footer")}
				</Text>

				<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
					<a
						href="https://hackathonweekly.com/"
						style={{
							color: "#000",
							textDecoration: "underline",
							fontWeight: 500,
						}}
					>
						{t("mail.weeklyReport.global.cta.button")}
					</a>
				</Text>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section>
				<Text
					style={{ fontSize: 12, color: "#999", margin: "0 0 8px" }}
				>
					© {new Date().getFullYear()} HackathonWeekly Team
				</Text>
				<Text style={{ fontSize: 12, color: "#999", margin: 0 }}>
					<a
						href={unsubscribeUrl}
						style={{
							color: "#999",
							textDecoration: "underline",
						}}
					>
						{t("mail.common.unsubscribe")}
					</a>
				</Text>
			</Section>
		</Wrapper>
	);
}
