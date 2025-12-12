import { getEventById } from "@/lib/database";
import { notFound } from "next/navigation";
import { EventRegistrationPage } from "./EventRegistrationPage";

interface EventRegistrationRouteProps {
	params: {
		eventId: string;
		locale: string;
	};
}

export default async function EventRegistrationRoute({
	params,
}: EventRegistrationRouteProps) {
	const { eventId } = await params;
	const event = await getEventById(eventId);

	if (!event) {
		notFound();
	}

	// Convert Date objects to strings for client component
	const serializedEvent = {
		...event,
		startTime: event.startTime.toISOString(),
		endTime: event.endTime.toISOString(),
		address: event.address || undefined,
		onlineUrl: event.onlineUrl || undefined,
		externalUrl: event.externalUrl || undefined,
		volunteerContactInfo: event.volunteerContactInfo || undefined,
		volunteerWechatQrCode: event.volunteerWechatQrCode || undefined,
		organizerContact: event.organizerContact || undefined,
		registrationSuccessInfo: event.registrationSuccessInfo || undefined,
		registrationSuccessImage: event.registrationSuccessImage || undefined,
		registrationPendingInfo: event.registrationPendingInfo || undefined,
		registrationPendingImage: event.registrationPendingImage || undefined,
		registrationFieldConfig: event.registrationFieldConfig || undefined,
		coverImage: event.coverImage || undefined,
		maxAttendees: event.maxAttendees || undefined,
		registrationDeadline: event.registrationDeadline?.toISOString(),
		createdAt: event.createdAt.toISOString(),
		buildingConfig: event.buildingConfig
			? {
					duration: event.buildingConfig.duration,
					requiredCheckIns: event.buildingConfig.requiredCheckIns,
					depositAmount: event.buildingConfig.depositAmount,
					refundRate: event.buildingConfig.refundRate,
					isPublic: event.buildingConfig.isPublic,
					allowAnonymous: event.buildingConfig.allowAnonymous,
					enableVoting: event.buildingConfig.enableVoting,
					paymentType: event.buildingConfig.paymentType || undefined,
					paymentUrl: event.buildingConfig.paymentUrl || undefined,
					paymentQRCode:
						event.buildingConfig.paymentQRCode || undefined,
					paymentNote: event.buildingConfig.paymentNote || undefined,
				}
			: undefined,
		organizer: {
			...event.organizer,
			image: event.organizer.image || undefined,
			username: event.organizer.username || undefined,
			bio: event.organizer.bio || undefined,
			region: event.organizer.region || undefined,
			userRoleString: event.organizer.userRoleString || undefined,
		},
		organization: event.organization
			? {
					...event.organization,
					slug: event.organization.slug || undefined,
					logo: event.organization.logo || undefined,
				}
			: undefined,
		ticketTypes: event.ticketTypes.map((ticketType) => ({
			...ticketType,
			description: ticketType.description || undefined,
			price: ticketType.price || undefined,
			maxQuantity: ticketType.maxQuantity || undefined,
			currentQuantity: ticketType._count?.registrations || 0,
		})),
	};

	return <EventRegistrationPage event={serializedEvent} />;
}
