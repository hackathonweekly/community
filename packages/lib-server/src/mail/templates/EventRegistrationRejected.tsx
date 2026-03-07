import { Hr, Heading, Section, Text } from "@react-email/components";
import type { Locale, Messages } from "@community/lib-shared/i18n";
import Wrapper from "../components/Wrapper";

interface EventRegistrationRejectedProps {
	locale: Locale;
	translations: Messages;
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	userName: string;
	rejectionReason?: string;
	alternativeEventsUrl?: string;
}

export const EventRegistrationRejected = ({
	locale,
	translations,
	eventTitle,
	eventDate,
	eventLocation,
	userName,
	rejectionReason,
	alternativeEventsUrl,
}: EventRegistrationRejectedProps) => {
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
					{locale === "zh"
						? "关于你的活动报名"
						: "About Your Event Registration"}
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
						? `感谢你对「${eventTitle}」的关注和报名申请。`
						: `Thank you for your interest in "${eventTitle}" and for submitting your registration.`}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					📅 {eventDate}
					<br />📍 {eventLocation}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{locale === "zh"
						? "很抱歉，由于以下原因，我们无法批准你这次的报名申请："
						: "We regret to inform you that we are unable to approve your registration for this event due to the following reason:"}
				</Text>

				{rejectionReason && (
					<div
						style={{
							backgroundColor: "#fef2f2",
							border: "1px solid #fecaca",
							borderRadius: 8,
							padding: 16,
							margin: "0 0 12px",
						}}
					>
						<Text
							style={{
								fontSize: 14,
								lineHeight: 1.5,
								color: "#991b1b",
								margin: 0,
								fontStyle: "italic",
							}}
						>
							{rejectionReason}
						</Text>
					</div>
				)}

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: 0,
					}}
				>
					{locale === "zh"
						? "我们深感抱歉，也感谢你的理解。请不要灰心，我们鼓励你关注我们未来的活动！"
						: "We sincerely apologize and appreciate your understanding. Please don't be discouraged, and we encourage you to stay tuned for our future events!"}
				</Text>
			</Section>

			{alternativeEventsUrl && (
				<Section style={{ marginBottom: 24 }}>
					<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
						<a
							href={alternativeEventsUrl}
							style={{
								color: "#000",
								textDecoration: "underline",
								fontWeight: 500,
							}}
						>
							{locale === "zh"
								? "浏览其他活动"
								: "Browse Other Events"}
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
	margin: "16px 0",
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

const reasonBox = {
	backgroundColor: "#fef2f2",
	border: "1px solid #fecaca",
	borderRadius: "8px",
	padding: "20px",
	margin: "24px 0",
};

const reasonText = {
	color: "#991b1b",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "0",
	fontStyle: "italic",
};

const buttonContainer = {
	textAlign: "center" as const,
	margin: "32px 0",
};

const button = {
	backgroundColor: "#3b82f6",
	borderRadius: "6px",
	color: "#ffffff",
	fontSize: "16px",
	fontWeight: "600",
	padding: "12px 24px",
	textDecoration: "none",
	display: "inline-block",
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "32px 0",
};

const footer = {
	color: "#8898aa",
	fontSize: "14px",
	lineHeight: "20px",
};
