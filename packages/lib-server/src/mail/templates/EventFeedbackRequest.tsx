import { Hr, Heading, Section, Text } from "@react-email/components";
import type { Locale, Messages } from "@community/lib-shared/i18n";
import Wrapper from "../components/Wrapper";

interface EventFeedbackRequestProps {
	locale: Locale;
	translations: Messages;
	eventTitle: string;
	eventDate: string;
	userName: string;
	feedbackUrl: string;
	eventUrl: string;
}

export const EventFeedbackRequest = ({
	locale,
	translations,
	eventTitle,
	eventDate,
	userName,
	feedbackUrl,
	eventUrl,
}: EventFeedbackRequestProps) => {
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
						? "感谢你的参与！"
						: "Thank you for attending!"}
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
						? `感谢你参与了「${eventTitle}」活动。我们希望这次活动对你有所帮助！`
						: `Thank you for participating in "${eventTitle}". We hope you found the event valuable!`}
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
						? "你的反馈对我们非常重要，能帮助我们不断改进活动质量。请花几分钟时间分享你的想法："
						: "Your feedback is incredibly valuable to us and helps us improve our events. Please take a few minutes to share your thoughts:"}
				</Text>

				<Text
					style={{
						fontSize: 14,
						fontWeight: 600,
						color: "#333",
						margin: "0 0 8px",
					}}
				>
					{locale === "zh"
						? "反馈内容包括："
						: "Your feedback will cover:"}
				</Text>
				<Text
					style={{
						fontSize: 14,
						lineHeight: 1.6,
						color: "#555",
						margin: "0 0 4px",
						paddingLeft: 8,
					}}
				>
					•{" "}
					{locale === "zh" ? "活动整体评分" : "Overall event rating"}
				</Text>
				<Text
					style={{
						fontSize: 14,
						lineHeight: 1.6,
						color: "#555",
						margin: "0 0 4px",
						paddingLeft: 8,
					}}
				>
					•{" "}
					{locale === "zh"
						? "内容质量评价"
						: "Content quality assessment"}
				</Text>
				<Text
					style={{
						fontSize: 14,
						lineHeight: 1.6,
						color: "#555",
						margin: "0 0 4px",
						paddingLeft: 8,
					}}
				>
					•{" "}
					{locale === "zh"
						? "组织和安排反馈"
						: "Organization and logistics feedback"}
				</Text>
				<Text
					style={{
						fontSize: 14,
						lineHeight: 1.6,
						color: "#555",
						margin: "0 0 12px",
						paddingLeft: 8,
					}}
				>
					•{" "}
					{locale === "zh"
						? "改进建议"
						: "Suggestions for improvement"}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: 0,
					}}
				>
					{locale === "zh"
						? "再次感谢你的参与，期待在下次活动中见到你！"
						: "Thank you again for your participation, and we look forward to seeing you at future events!"}
				</Text>
			</Section>

			<Section style={{ marginBottom: 24 }}>
				<Text
					style={{ fontSize: 13, color: "#666", margin: "0 0 8px" }}
				>
					<a
						href={feedbackUrl}
						style={{
							color: "#000",
							textDecoration: "underline",
							fontWeight: 500,
						}}
					>
						{locale === "zh"
							? "提交活动反馈"
							: "Submit Event Feedback"}
					</a>
				</Text>
				<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
					<a
						href={eventUrl}
						style={{
							color: "#0ea5e9",
							textDecoration: "underline",
						}}
					>
						{locale === "zh" ? "查看活动页面" : "View Event Page"}
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
	backgroundColor: "#f0f9ff",
	border: "1px solid #bae6fd",
	borderRadius: "8px",
	padding: "24px",
	margin: "24px 0",
};

const eventTitleStyle = {
	color: "#0c4a6e",
	fontSize: "20px",
	fontWeight: "600",
	margin: "0 0 12px 0",
};

const eventDetails = {
	color: "#0369a1",
	fontSize: "14px",
	margin: "4px 0",
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

const feedbackPoints = {
	color: "#333",
	fontSize: "16px",
	fontWeight: "600",
	margin: "24px 0 12px 0",
};

const listItem = {
	color: "#555",
	fontSize: "14px",
	margin: "4px 0",
	paddingLeft: "8px",
};

const linkContainer = {
	textAlign: "center" as const,
	margin: "16px 0",
};

const link = {
	color: "#3b82f6",
	textDecoration: "underline",
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "32px 0",
};

const footer = {
	color: "#8898aa",
	fontSize: "14px",
	lineHeight: "20px",
	fontStyle: "italic",
};
