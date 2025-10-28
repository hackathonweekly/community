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

interface EventRegistrationConfirmationProps {
	locale: Locale;
	translations: Messages;
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
	userName: string;
}

export const EventRegistrationConfirmation = ({
	locale,
	translations,
	eventTitle,
	eventDate,
	eventLocation,
	eventUrl,
	userName,
}: EventRegistrationConfirmationProps) => {
	return (
		<Html>
			<Head />
			<Preview>
				{translations.mail.eventRegistrationConfirmation.preview}
			</Preview>
			<Container>
				<Section>
					<Text>
						{translations.mail.eventRegistrationConfirmation.greeting.replace(
							"{name}",
							userName,
						)}
					</Text>

					<Text>
						{translations.mail.eventRegistrationConfirmation.message.replace(
							"{eventTitle}",
							eventTitle,
						)}
					</Text>

					<Text>
						<strong>
							{
								translations.mail.eventRegistrationConfirmation
									.eventDetails
							}
							:
						</strong>
					</Text>
					<Text>
						{
							translations.mail.eventRegistrationConfirmation
								.eventTitle
						}
						: {eventTitle}
					</Text>
					<Text>
						{
							translations.mail.eventRegistrationConfirmation
								.eventDate
						}
						: {eventDate}
					</Text>
					<Text>
						{
							translations.mail.eventRegistrationConfirmation
								.eventLocation
						}
						: {eventLocation}
					</Text>

					<Button href={eventUrl}>
						{
							translations.mail.eventRegistrationConfirmation
								.viewEvent
						}
					</Button>

					<Text>
						{translations.mail.eventRegistrationConfirmation.footer}
					</Text>
				</Section>
			</Container>
		</Html>
	);
};
