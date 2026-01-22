import {
	Button,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type { Locale, Messages } from "@/lib/i18n";

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
	translations,
	eventTitle,
	eventDate,
	eventLocation,
	eventUrl,
	orderNo,
	userName,
}: EventOrderCancelledProps) => {
	return (
		<Html>
			<Head />
			<Preview>{translations.mail.eventOrderCancelled.preview}</Preview>
			<Container>
				<Section>
					<Text>
						{translations.mail.eventOrderCancelled.greeting.replace(
							"{name}",
							userName,
						)}
					</Text>

					<Text>
						{translations.mail.eventOrderCancelled.message.replace(
							"{eventTitle}",
							eventTitle,
						)}
					</Text>

					<Text>
						<strong>
							{translations.mail.eventOrderCancelled.orderNumber}:
						</strong>{" "}
						{orderNo}
					</Text>

					<Text>
						<strong>
							{translations.mail.eventOrderCancelled.eventDetails}
							:
						</strong>
					</Text>
					<Text>
						{translations.mail.eventOrderCancelled.eventTitle}:{" "}
						{eventTitle}
					</Text>
					<Text>
						{translations.mail.eventOrderCancelled.eventDate}:{" "}
						{eventDate}
					</Text>
					<Text>
						{translations.mail.eventOrderCancelled.eventLocation}:{" "}
						{eventLocation}
					</Text>

					<Button href={eventUrl}>
						{translations.mail.eventOrderCancelled.viewEvent}
					</Button>

					<Text>{translations.mail.eventOrderCancelled.footer}</Text>
				</Section>
			</Container>
		</Html>
	);
};
