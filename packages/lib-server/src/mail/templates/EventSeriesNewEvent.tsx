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

interface EventSeriesNewEventProps {
	locale: Locale;
	translations: Messages;
	seriesName: string;
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
	seriesUrl: string;
}

export const EventSeriesNewEvent = ({
	locale: _locale,
	translations,
	seriesName,
	eventTitle,
	eventDate,
	eventLocation,
	eventUrl,
	seriesUrl,
}: EventSeriesNewEventProps) => {
	const t = translations.mail.eventSeriesNewEvent;

	const preview = t.preview
		.replace("{seriesName}", seriesName)
		.replace("{eventTitle}", eventTitle);

	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Container>
				<Section>
					<Text>{t.greeting}</Text>
					<Text>
						{t.announcement
							.replace("{seriesName}", seriesName)
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

				<Section style={{ textAlign: "center", margin: "0 0 24px 0" }}>
					<Button href={seriesUrl}>{t.viewSeries}</Button>
				</Section>

				<Section>
					<Text>{t.footer.replace("{seriesName}", seriesName)}</Text>
				</Section>
			</Container>
		</Html>
	);
};
