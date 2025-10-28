import { getEventById } from "@/lib/database";
import { auth } from "@/lib/auth";
import { canManageEvent } from "@/features/permissions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailsWrapper } from "./EventDetailsWrapper";

// Enable ISR: Revalidate every 5 minutes
// dynamicParams: 允许运行时生成未预渲染的活动页面
export const dynamicParams = true;
export const revalidate = 300;

interface EventDetailsPageProps {
	params: {
		eventId: string;
		locale: string;
	};
}

export async function generateMetadata({
	params,
}: EventDetailsPageProps): Promise<Metadata> {
	const { eventId, locale } = await params;
	const event = await getEventById(eventId);

	if (!event) {
		return {
			title: "Event Not Found",
			description: "The requested event could not be found.",
		};
	}

	// 检查活动是否结束（双重判断）
	const isEventEnded =
		new Date() >= new Date(event.endTime) || event.status === "COMPLETED";
	const isZh = locale?.startsWith("zh");

	// 根据活动状态动态调整标题
	const getTitle = () => {
		if (isZh) {
			return isEventEnded
				? `活动回顾：${event.title}`
				: `社区活动：${event.title}`;
		}
		return `${event.title} | HackathonWeekly Events`;
	};

	const title = getTitle();
	const ogTitle = isZh
		? isEventEnded
			? `活动回顾：${event.title}`
			: `${event.title}`
		: event.title;

	return {
		title,
		description:
			event.shortDescription?.slice(0, 160) || "No description available",
		openGraph: {
			title: ogTitle,
			description:
				event.shortDescription?.slice(0, 160) ||
				"No description available",
			type: "article",
			images: event.coverImage ? [event.coverImage] : undefined,
		},
		twitter: {
			card: "summary_large_image",
			title: ogTitle,
			description:
				event.shortDescription?.slice(0, 160) ||
				"No description available",
			images: event.coverImage ? [event.coverImage] : undefined,
		},
	};
}

export default async function EventDetailsPage({
	params,
}: EventDetailsPageProps) {
	const { eventId } = await params;
	const event = await getEventById(eventId);

	if (!event) {
		notFound();
	}

	// Check if current user is admin of this event
	let isEventAdmin = false;
	try {
		const session = await auth.api.getSession({
			headers:
				await /* @next-codemod-error The APIs under 'next/headers' are async now, need to be manually awaited. */
				import("next/headers").then((m) => m.headers()),
		});

		if (session?.user?.id) {
			isEventAdmin = await canManageEvent(eventId, session.user.id);
		}
	} catch (adminCheckError) {
		// Log error but don't fail the request
		console.error("Error checking admin status:", adminCheckError);
	}

	// Convert Date objects to strings for client component
	const serializedEvent = {
		...event,
		isEventAdmin,
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
			isRequired: false, // Default to false since we removed this field
			sopUrl: undefined, // Removed field, set to undefined
			wechatQrCode: undefined, // Moved to global level, set to undefined
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

	return <EventDetailsWrapper initialEvent={serializedEvent} />;
}
