import { Hr, Heading, Section, Text } from "@react-email/components";
import type { Locale, Messages } from "@community/lib-shared/i18n";
import Wrapper from "../components/Wrapper";

interface EventUpdateProps {
	locale: Locale;
	translations: Messages;
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
	userName: string;
	updateType:
		| "TIME_CHANGE"
		| "LOCATION_CHANGE"
		| "GENERAL_UPDATE"
		| "CANCELLED";
	updateDetails: string;
}

export const EventUpdate = ({
	locale,
	translations,
	eventTitle,
	eventDate,
	eventLocation,
	eventUrl,
	userName,
	updateType,
	updateDetails,
}: EventUpdateProps) => {
	const getUpdateTypeTitle = () => {
		switch (updateType) {
			case "TIME_CHANGE":
				return locale === "zh" ? "活动时间变更" : "Event Time Changed";
			case "LOCATION_CHANGE":
				return locale === "zh"
					? "活动地点变更"
					: "Event Location Changed";
			case "CANCELLED":
				return locale === "zh" ? "活动已取消" : "Event Cancelled";
			default:
				return locale === "zh"
					? "活动信息更新"
					: "Event Information Updated";
		}
	};

	const updateLines = updateDetails
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);

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
					{getUpdateTypeTitle()}
				</Heading>

				<Text style={{ fontSize: 13, color: "#999", margin: 0 }}>
					{locale === "zh" ? `你好 ${userName}` : `Hi ${userName}`}
				</Text>
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
					{locale === "zh"
						? `你报名的活动「${eventTitle}」有重要更新：`
						: `There's an important update for the event "${eventTitle}" you registered for:`}
				</Text>

				<div
					style={{
						backgroundColor: "#fff3cd",
						border: "1px solid #ffeaa7",
						borderRadius: 8,
						padding: 16,
						margin: "12px 0",
					}}
				>
					<Text
						style={{
							fontSize: 14,
							fontWeight: 600,
							color: "#856404",
							margin: "0 0 8px",
						}}
					>
						{locale === "zh" ? "更新内容：" : "Update Details:"}
					</Text>
					{updateLines.map((line, index) => (
						<Text
							key={`update-${index}`}
							style={{
								fontSize: 14,
								lineHeight: 1.5,
								color: "#856404",
								margin:
									index === updateLines.length - 1
										? 0
										: "0 0 8px",
							}}
						>
							{line}
						</Text>
					))}
				</div>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "12px 0 0",
					}}
				>
					📅 {eventDate}
					<br />📍 {eventLocation}
				</Text>
			</Section>

			{updateType !== "CANCELLED" && (
				<Section style={{ marginBottom: 24 }}>
					<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
						<a
							href={eventUrl}
							style={{
								color: "#000",
								textDecoration: "underline",
								fontWeight: 500,
							}}
						>
							{locale === "zh"
								? "查看活动详情"
								: "View Event Details"}
						</a>
					</Text>
				</Section>
			)}

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section>
				<Text style={{ fontSize: 12, color: "#999", margin: 0 }}>
					© {new Date().getFullYear()} HackathonWeekly Team
				</Text>
			</Section>
		</Wrapper>
	);
};

const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
};

const h1 = {
	color: "#333",
	fontSize: "24px",
	fontWeight: "bold",
	margin: "40px 0",
	padding: "0",
};

const text = {
	color: "#333",
	fontSize: "16px",
	lineHeight: "26px",
};

const eventCard = {
	backgroundColor: "#f8fafc",
	border: "1px solid #e2e8f0",
	borderRadius: "8px",
	padding: "24px",
	margin: "24px 0",
};

const eventTitleStyle = {
	color: "#1a202c",
	fontSize: "20px",
	fontWeight: "600",
	margin: "0 0 12px 0",
};

const eventDetails = {
	color: "#4a5568",
	fontSize: "14px",
	margin: "4px 0",
};

const updateBox = {
	backgroundColor: "#fff3cd",
	border: "1px solid #ffeaa7",
	borderRadius: "8px",
	padding: "20px",
	margin: "24px 0",
};

const updateHeader = {
	color: "#856404",
	fontSize: "16px",
	fontWeight: "600",
	margin: "0 0 12px 0",
};

const updateText = {
	color: "#856404",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "0",
};

const updateTextWithSpacing = {
	...updateText,
	margin: "0 0 8px 0",
};

const buttonContainer = {
	textAlign: "center" as const,
	margin: "32px 0",
};

const button = {
	backgroundColor: "#007ee6",
	borderRadius: "4px",
	color: "#fff",
	fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
	fontSize: "15px",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	width: "210px",
	padding: "14px 7px",
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "20px 0",
};

const footer = {
	color: "#8898aa",
	fontSize: "12px",
	lineHeight: "16px",
};
