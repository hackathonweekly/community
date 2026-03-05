import {
	Button,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type { Locale, Messages } from "@community/lib-shared/i18n";

interface EventReminderProps {
	locale: Locale;
	translations: Messages;
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
	userName: string;
	daysUntilEvent: number;
}

export const EventReminder = ({
	locale,
	translations,
	eventTitle,
	eventDate,
	eventLocation,
	eventUrl,
	userName,
	daysUntilEvent,
}: EventReminderProps) => {
	return (
		<Html>
			<Head />
			<Preview>{translations.mail.eventReminder.preview}</Preview>
			<Container>
				<Section>
					<Text>
						{translations.mail.eventReminder.greeting.replace(
							"{name}",
							userName,
						)}
					</Text>

					<Text>
						{translations.mail.eventReminder.message
							.replace("{eventTitle}", eventTitle)
							.replace(
								"{daysUntilEvent}",
								daysUntilEvent.toString(),
							)}
					</Text>

					<Text>
						<strong>
							{translations.mail.eventReminder.eventDetails}:
						</strong>
					</Text>
					<Text>
						{translations.mail.eventReminder.eventTitle}:{" "}
						{eventTitle}
					</Text>
					<Text>
						{translations.mail.eventReminder.eventDate}: {eventDate}
					</Text>
					<Text>
						{translations.mail.eventReminder.eventLocation}:{" "}
						{eventLocation}
					</Text>

					<Button href={eventUrl}>
						{translations.mail.eventReminder.viewEvent}
					</Button>

					<Text>{translations.mail.eventReminder.footer}</Text>
				</Section>
			</Container>
		</Html>
	);
};
