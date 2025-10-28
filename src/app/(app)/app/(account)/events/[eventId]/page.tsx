import { redirect } from "next/navigation";

interface EventRedirectPageProps {
	params: Promise<{ eventId: string }>;
}

export default async function EventRedirectPage({
	params,
}: EventRedirectPageProps) {
	const { eventId } = await params;
	redirect(`/app/events/${eventId}/manage`);
}
