import { canManageEvent } from "@/features/permissions";
import { auth } from "@/lib/auth";
import { getEventById } from "@/lib/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventPageWrapper } from "./EventPageWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
	params: Promise<{ locale: string; eventId: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { eventId } = await params;
	const event = await getEventById(eventId);

	if (!event) {
		return {
			title: "活动不存在",
			description: "未找到该活动",
		};
	}

	const isEventEnded =
		new Date() >= new Date(event.endTime) || event.status === "COMPLETED";
	const title = isEventEnded
		? `活动回顾：${event.title}`
		: `社区活动：${event.title}`;

	return {
		title,
		description:
			event.shortDescription?.slice(0, 160) || "No description available",
		openGraph: {
			title,
			description:
				event.shortDescription?.slice(0, 160) ||
				"No description available",
			type: "article",
			images: event.coverImage ? [event.coverImage] : undefined,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description:
				event.shortDescription?.slice(0, 160) ||
				"No description available",
			images: event.coverImage ? [event.coverImage] : undefined,
		},
	};
}

export default async function EventPage({ params }: PageProps) {
	const { eventId, locale } = await params;
	const event = await getEventById(eventId);

	if (!event) {
		notFound();
	}

	// Check if current user is admin of this event
	let isEventAdmin = false;
	try {
		const session = await auth.api.getSession({
			headers: await import("next/headers").then((m) => m.headers()),
		});

		if (session?.user?.id) {
			isEventAdmin = await canManageEvent(eventId, session.user.id);
		}
	} catch (adminCheckError) {
		console.error("Error checking admin status:", adminCheckError);
	}

	const serializedEvent = {
		...event,
		isEventAdmin,
		richContent: event.richContent || undefined,
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
		registrations: event.registrations.map((reg) => ({
			...reg,
			registeredAt: reg.registeredAt.toISOString(),
			user: {
				...reg.user,
				image: reg.user.image || undefined,
				username: reg.user.username || undefined,
				userRoleString: reg.user.userRoleString || undefined,
				currentWorkOn: reg.user.currentWorkOn || undefined,
				bio: reg.user.bio || undefined,
				lifeStatus: reg.user.lifeStatus || undefined,
				region: reg.user.region || undefined,
				skills: reg.user.skills || undefined,
				whatICanOffer: reg.user.whatICanOffer || undefined,
				whatIAmLookingFor: reg.user.whatIAmLookingFor || undefined,
				showEmail: reg.user.showEmail || false,
				email: reg.user.email || undefined,
				showWechat: reg.user.showWechat || false,
				wechatId: reg.user.wechatId || undefined,
				githubUrl: reg.user.githubUrl || undefined,
				twitterUrl: reg.user.twitterUrl || undefined,
				websiteUrl: reg.user.websiteUrl || undefined,
			},
		})),
		feedbacks: event.feedbacks.map((feedback) => ({
			...feedback,
			createdAt: feedback.createdAt.toISOString(),
			comment: feedback.comment || undefined,
			suggestions: feedback.suggestions || undefined,
			user: {
				...feedback.user,
				image: feedback.user.image || undefined,
				username: feedback.user.username || undefined,
			},
		})),
		ticketTypes: event.ticketTypes.map((ticketType) => ({
			...ticketType,
			description: ticketType.description || undefined,
			price: ticketType.price || undefined,
			maxQuantity: ticketType.maxQuantity || undefined,
			currentQuantity: ticketType._count?.registrations || 0,
		})),
		volunteerRoles: event.volunteerRoles?.map((eventVolunteerRole) => ({
			...eventVolunteerRole,
			isRequired: false,
			sopUrl: undefined,
			wechatQrCode: undefined,
			description: eventVolunteerRole.description || undefined,
			volunteerRole: {
				...eventVolunteerRole.volunteerRole,
				detailDescription:
					eventVolunteerRole.volunteerRole.detailDescription ||
					undefined,
				iconUrl: eventVolunteerRole.volunteerRole.iconUrl || undefined,
			},
			registrations: eventVolunteerRole.registrations.map(
				(registration) => ({
					...registration,
					appliedAt: registration.appliedAt.toISOString(),
					approvedAt: registration.approvedAt?.toISOString(),
					note: registration.note || undefined,
					user: {
						...registration.user,
						image: registration.user.image || undefined,
						username: registration.user.username || undefined,
						userRoleString:
							registration.user.userRoleString || undefined,
						currentWorkOn:
							registration.user.currentWorkOn || undefined,
					},
				}),
			),
		})),
	};

	return <EventPageWrapper initialEvent={serializedEvent} locale={locale} />;
}
