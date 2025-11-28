import { notFound, redirect } from "next/navigation";
import { getEventById } from "@/lib/database";
import { config } from "@/config";

interface PageProps {
	params: Promise<{ eventId: string }>;
}

export default async function EventSubmissionsPage({ params }: PageProps) {
	const { eventId } = await params;
	const event = await getEventById(eventId);

	if (!event) {
		notFound();
	}

	redirect(`/${config.i18n.defaultLocale}/events/${eventId}/submissions`);
}
