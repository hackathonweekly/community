import {
	getEventMetadataById,
	getEventPublicById,
} from "@community/lib-server/database";
import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { EventDetailsWrapper } from "@/modules/public/events/detail/EventDetailsWrapper";

// 公共活动详情允许短期缓存，减少首屏等待；登录态数据在客户端补全
export const revalidate = 60;

interface EventDetailsPageProps {
	params: {
		eventId: string;
	};
}

type EventFeedbackItem = Prisma.EventFeedbackGetPayload<{
	include: {
		user: {
			select: {
				id: true;
				name: true;
				image: true;
				username: true;
			};
		};
	};
}>;

export async function generateMetadata({
	params,
}: EventDetailsPageProps): Promise<Metadata> {
	const { eventId } = await params;
	const locale = await getLocale();
	const event = await getEventMetadataById(eventId);

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
	const locale = await getLocale();

	const event = await getEventPublicById(eventId);

	if (!event) {
		notFound();
	}

	const feedbacks =
		(event as { feedbacks?: EventFeedbackItem[] }).feedbacks ?? [];

	// Convert Date objects to strings for client component
	const serializedEvent = {
		...event,
		isEventAdmin: false,
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
					summary: event.organization.summary || undefined,
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
			},
		})),
		feedbacks: feedbacks.map((feedback) => ({
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
					status: registration.status,
					user: {
						id: registration.user.id,
					},
				}),
			),
		})),
	};

	return (
		<EventDetailsWrapper initialEvent={serializedEvent} locale={locale} />
	);
}
