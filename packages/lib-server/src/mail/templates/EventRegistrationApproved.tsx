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

interface EventRegistrationApprovedProps {
	locale: Locale;
	translations: Messages;
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
	userName: string;
}

export const EventRegistrationApproved = ({
	locale,
	translations,
	eventTitle,
	eventDate,
	eventLocation,
	eventUrl,
	userName,
}: EventRegistrationApprovedProps) => {
	return (
		<Html>
			<Head />
			<Preview>
				{translations.mail.eventRegistrationApproved.preview}
			</Preview>
			<Container>
				<Section>
					<Text>
						{translations.mail.eventRegistrationApproved.greeting.replace(
							"{name}",
							userName,
						)}
					</Text>

					<Text>
						{translations.mail.eventRegistrationApproved.message.replace(
							"{eventTitle}",
							eventTitle,
						)}
					</Text>

					<Text>
						<strong>
							{
								translations.mail.eventRegistrationApproved
									.eventDetails
							}
							:
						</strong>
					</Text>
					<Text>
						{translations.mail.eventRegistrationApproved.eventTitle}
						: {eventTitle}
					</Text>
					<Text>
						{translations.mail.eventRegistrationApproved.eventDate}:{" "}
						{eventDate}
					</Text>
					<Text>
						{
							translations.mail.eventRegistrationApproved
								.eventLocation
						}
						: {eventLocation}
					</Text>

					<Button href={eventUrl}>
						{translations.mail.eventRegistrationApproved.viewEvent}
					</Button>

					<Text>
						{translations.mail.eventRegistrationApproved.footer}
					</Text>
				</Section>
			</Container>
		</Html>
	);
};
