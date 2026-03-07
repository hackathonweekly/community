import Wrapper from "../components/Wrapper";
import { Text, Hr, Heading, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface WeeklyReportOrganizationProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	weekRange: string;
	organizationName: string;
	data: {
		organizationId: string;
		organizationSlug?: string;
		newMembers: number;
		organizationEvents: Array<{
			id: string;
			title: string;
			startTime: string;
			attendeeCount: number;
		}>;
	};
	unsubscribeUrl: string;
}

export function WeeklyReportOrganization({
	locale,
	translations,
	weekRange,
	organizationName,
	data,
	unsubscribeUrl,
}: WeeklyReportOrganizationProps) {
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
					{organizationName}{" "}
					{t("mail.weeklyReport.organization.title")}
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
					<strong>
						📊 {t("mail.weeklyReport.organization.overview")}
					</strong>
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 4px",
					}}
				>
					{t("mail.weeklyReport.organization.newMembers")}:{" "}
					{data.newMembers}
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{t("mail.weeklyReport.organization.events")}:{" "}
					{data.organizationEvents.length}
				</Text>

				{data.organizationEvents.length > 0 && (
					<>
						<Text
							style={{
								fontSize: 15,
								lineHeight: 1.7,
								color: "#333",
								margin: "0 0 8px",
							}}
						>
							<strong>
								📅{" "}
								{t(
									"mail.weeklyReport.organization.eventReview",
								)}
							</strong>
						</Text>
						{data.organizationEvents.slice(0, 3).map((event) => (
							<Text
								key={event.id}
								style={{
									fontSize: 15,
									lineHeight: 1.7,
									color: "#333",
									margin: "0 0 4px",
								}}
							>
								• {event.title} ({event.attendeeCount}{" "}
								{t("mail.weeklyReport.organization.attendees")})
							</Text>
						))}
					</>
				)}

				<Text
					style={{ fontSize: 13, color: "#666", margin: "12px 0 0" }}
				>
					<a
						href={`https://hackathonweekly.com/orgs/${data.organizationSlug ?? data.organizationId}/manage`}
						style={{
							color: "#000",
							textDecoration: "underline",
							fontWeight: 500,
						}}
					>
						{t("mail.weeklyReport.organization.cta.button")}
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
