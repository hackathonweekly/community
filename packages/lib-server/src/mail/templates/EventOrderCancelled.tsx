import { Hr, Heading, Section, Text } from "@react-email/components";
import type { Locale, Messages } from "@community/lib-shared/i18n";
import Wrapper from "../components/Wrapper";

interface EventOrderCancelledProps {
	locale: Locale;
	translations: Messages;
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
	orderNo: string;
	userName: string;
}

export const EventOrderCancelled = ({
	locale,
	translations,
	eventTitle,
	eventDate,
	eventLocation,
	eventUrl,
	orderNo,
	userName,
}: EventOrderCancelledProps) => {
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
					{translations.mail.eventOrderCancelled.greeting.replace(
						"{name}",
						userName,
					)}
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
					{translations.mail.eventOrderCancelled.message.replace(
						"{eventTitle}",
						eventTitle,
					)}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 8px",
					}}
				>
					<strong>
						{translations.mail.eventOrderCancelled.orderNumber}:
					</strong>{" "}
					{orderNo}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 8px",
					}}
				>
					<strong>
						{translations.mail.eventOrderCancelled.eventDetails}:
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
					{translations.mail.eventOrderCancelled.eventTitle}:{" "}
					{eventTitle}
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 4px",
					}}
				>
					{translations.mail.eventOrderCancelled.eventDate}:{" "}
					{eventDate}
				</Text>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{translations.mail.eventOrderCancelled.eventLocation}:{" "}
					{eventLocation}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{translations.mail.eventOrderCancelled.footer}
				</Text>

				<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
					<a
						href={eventUrl}
						style={{
							color: "#000",
							textDecoration: "underline",
							fontWeight: 500,
						}}
					>
						{translations.mail.eventOrderCancelled.viewEvent}
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
