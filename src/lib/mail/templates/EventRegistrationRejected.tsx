import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type { Locale, Messages } from "@/lib/i18n";

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
	const previewText =
		locale === "zh"
			? `关于你的活动报名申请 - ${eventTitle}`
			: `About your event registration - ${eventTitle}`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>
						{locale === "zh"
							? "关于你的活动报名"
							: "About Your Event Registration"}
					</Heading>

					<Text style={text}>
						{locale === "zh"
							? `你好 ${userName}，`
							: `Hi ${userName},`}
					</Text>

					<Text style={text}>
						{locale === "zh"
							? `感谢你对「${eventTitle}」的关注和报名申请。`
							: `Thank you for your interest in "${eventTitle}" and for submitting your registration.`}
					</Text>

					<Section style={eventCard}>
						<Heading as="h2" style={eventTitleStyle}>
							{eventTitle}
						</Heading>
						<Text style={eventDetails}>📅 {eventDate}</Text>
						<Text style={eventDetails}>📍 {eventLocation}</Text>
					</Section>

					<Text style={text}>
						{locale === "zh"
							? "很抱歉，由于以下原因，我们无法批准你这次的报名申请："
							: "We regret to inform you that we are unable to approve your registration for this event due to the following reason:"}
					</Text>

					{rejectionReason && (
						<Section style={reasonBox}>
							<Text style={reasonText}>{rejectionReason}</Text>
						</Section>
					)}

					<Text style={text}>
						{locale === "zh"
							? "我们深感抱歉，也感谢你的理解。请不要灰心，我们鼓励你关注我们未来的活动！"
							: "We sincerely apologize and appreciate your understanding. Please don't be discouraged, and we encourage you to stay tuned for our future events!"}
					</Text>

					{alternativeEventsUrl && (
						<Section style={buttonContainer}>
							<Button href={alternativeEventsUrl} style={button}>
								{locale === "zh"
									? "浏览其他活动"
									: "Browse Other Events"}
							</Button>
						</Section>
					)}

					<Hr style={hr} />

					<Text style={footer}>
						{locale === "zh"
							? "如有任何问题或需要进一步说明，请随时联系我们。我们期待在未来的活动中见到你！"
							: "If you have any questions or need further clarification, please don't hesitate to contact us. We look forward to seeing you at future events!"}
					</Text>
				</Container>
			</Body>
		</Html>
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
