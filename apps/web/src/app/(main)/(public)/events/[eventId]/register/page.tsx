import { getEventById } from "@community/lib-server/database";
import { notFound } from "next/navigation";
import { EventRegistrationPage } from "@/modules/public/events/detail/register/EventRegistrationPage";

interface EventRegistrationRouteProps {
	params: {
		eventId: string;
	};
}

export default async function EventRegistrationRoute({
	params,
}: EventRegistrationRouteProps) {
	const { eventId } = await params;
	const event = await getEventById(eventId, { includeAdminData: false });

	if (!event) {
		notFound();
	}

	// Build a strict whitelist payload to avoid leaking admin-only fields.
	const serializedEvent = {
		id: event.id,
		shortId: event.shortId || undefined,
		title: event.title,
		type: event.type,
		status: event.status,
		startTime: event.startTime.toISOString(),
		endTime: event.endTime.toISOString(),
		isOnline: event.isOnline,
		address: event.address || undefined,
		onlineUrl: event.onlineUrl || undefined,
		isExternalEvent: event.isExternalEvent,
		externalUrl: event.externalUrl || undefined,
		requireApproval: event.requireApproval,
		requireProjectSubmission: event.requireProjectSubmission,
		askDigitalCardConsent: event.askDigitalCardConsent,
		registrationSuccessInfo: event.registrationSuccessInfo || undefined,
		registrationSuccessImage: event.registrationSuccessImage || undefined,
		registrationPendingInfo: event.registrationPendingInfo || undefined,
		registrationPendingImage: event.registrationPendingImage || undefined,
		registrationFieldConfig: event.registrationFieldConfig || undefined,
		registrationDeadline: event.registrationDeadline?.toISOString(),
		questions: event.questions.map((question) => ({
			id: question.id,
			question: question.question,
			description: question.description || undefined,
			type: question.type,
			required: question.required,
			options: question.options,
			order: question.order,
		})),
		ticketTypes: event.ticketTypes.map((ticketType) => ({
			id: ticketType.id,
			name: ticketType.name,
			description: ticketType.description || undefined,
			price: ticketType.price || undefined,
			maxQuantity: ticketType.maxQuantity || undefined,
			currentQuantity:
				ticketType.currentQuantity ??
				ticketType._count?.registrations ??
				0,
			isActive: ticketType.isActive,
			sortOrder: ticketType.sortOrder,
			priceTiers: ticketType.priceTiers?.map((tier) => ({
				quantity: tier.quantity,
				price: tier.price,
				currency: tier.currency || undefined,
			})),
		})),
	};

	return <EventRegistrationPage event={serializedEvent} />;
}
