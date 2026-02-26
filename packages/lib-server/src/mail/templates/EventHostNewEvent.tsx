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

interface EventHostNewEventProps {
	locale: Locale;
	translations: Messages;
	hostName: string;
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
}

export const EventHostNewEvent = ({
	locale: _locale,
	translations,
	hostName,
	eventTitle,
	eventDate,
	eventLocation,
	eventUrl,
}: EventHostNewEventProps) => {
	const t = translations.mail.eventHostNewEvent;

	const preview = t.preview
		.replace("{hostName}", hostName)
		.replace("{eventTitle}", eventTitle);

	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Container>
				<Section>
					<Text>{t.greeting.replace("{hostName}", hostName)}</Text>
					<Text>
						{t.announcement
							.replace("{hostName}", hostName)
							.replace("{eventTitle}", eventTitle)}
					</Text>
				</Section>

				<Section>
					<Text>
						<strong>{t.eventDetails}</strong>
					</Text>
					<Text>
						{t.eventTitleLabel}: {eventTitle}
					</Text>
					<Text>
						{t.eventDateLabel}: {eventDate}
					</Text>
					<Text>
						{t.eventLocationLabel}: {eventLocation}
					</Text>
				</Section>

				<Section style={{ textAlign: "center", margin: "24px 0" }}>
					<Button href={eventUrl}>{t.viewEvent}</Button>
				</Section>

				<Section>
					<Text>{t.footer.replace("{hostName}", hostName)}</Text>
				</Section>

				<Section style={{ marginTop: 32 }}>
					<Text style={{ fontSize: 12, color: "#777" }}>
						{t.managePreferences}
					</Text>
				</Section>
			</Container>
		</Html>
	);
};
