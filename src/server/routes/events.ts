import { getVisitorRestrictionsConfig } from "@/config/visitor-restrictions";
import {
	HackathonConfigSchema,
	withHackathonConfigDefaults,
} from "@/features/hackathon/config";
import { NotificationService } from "@/features/notifications/service";
import { RestrictedAction, canUserDoAction } from "@/features/permissions";
import { auth } from "@/lib/auth";
import {
	resolveRegistrationFieldConfig,
	type RegistrationFieldConfig,
} from "@/lib/events/registration-fields";
import {
	ContentType,
	createContentValidator,
	ensureImageSafe,
} from "@/lib/content-moderation";
import {
	createEvent,
	deleteEvent,
	getActiveEventHostSubscribers,
	getEventById,
	getEvents,
	getOrganizationMembership,
	incrementEventViewCount,
	updateEvent,
} from "@/lib/database";
import { db } from "@/lib/database/prisma";
import type { Locale } from "@/lib/i18n";
import { isSendableEmail } from "@/lib/mail/address";
import {
	sendEventHostNewEventAnnouncement,
	sendEventUpdate,
} from "@/lib/mail/events";
import { zValidator } from "@hono/zod-validator";
import type { Prisma } from "@prisma/client";
import type { Event, RegistrationStatus } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { eventAdminRouter } from "./events/admins";
import checkinRouter from "./events/checkin";
import feedbackRouter from "./events/feedback";
import { eventInvitesRouter } from "./events/invites";
import { eventLikesRouter } from "./events/likes";
import participantInterestsRouter from "./events/participant-interests";
import participantsRouter from "./events/participants";
import { eventPhotosRouter } from "./events/photos";
import registrationsRouter from "./events/registrations";
import statusRouter from "./events/status";
import { eventTicketTypesRouter } from "./events/ticket-types";
import volunteerAdminRouter from "./events/volunteer-admin";
import volunteersRouter from "./events/volunteers";

const registrationFieldSwitchSchema = z.object({
	enabled: z.boolean().optional(),
	required: z.boolean().optional(),
});

const registrationFieldConfigSchema = z
	.object({
		template: z.enum(["FULL", "MINIMAL", "CUSTOM"]).optional(),
		fields: z
			.object({
				name: registrationFieldSwitchSchema.optional(),
				userRoleString: registrationFieldSwitchSchema.optional(),
				currentWorkOn: registrationFieldSwitchSchema.optional(),
				lifeStatus: registrationFieldSwitchSchema.optional(),
				bio: registrationFieldSwitchSchema.optional(),
				phoneNumber: registrationFieldSwitchSchema.optional(),
				email: registrationFieldSwitchSchema.optional(),
				wechatId: registrationFieldSwitchSchema.optional(),
				shippingAddress: registrationFieldSwitchSchema.optional(),
			})
			.optional(),
	})
	.optional()
	.transform((val) =>
		resolveRegistrationFieldConfig(
			val as Partial<RegistrationFieldConfig> | null | undefined,
		),
	);

const registrationFieldConfigUpdateSchema = z
	.object({
		template: z.enum(["FULL", "MINIMAL", "CUSTOM"]).optional(),
		fields: z
			.object({
				name: registrationFieldSwitchSchema.optional(),
				userRoleString: registrationFieldSwitchSchema.optional(),
				currentWorkOn: registrationFieldSwitchSchema.optional(),
				lifeStatus: registrationFieldSwitchSchema.optional(),
				bio: registrationFieldSwitchSchema.optional(),
				phoneNumber: registrationFieldSwitchSchema.optional(),
				email: registrationFieldSwitchSchema.optional(),
				wechatId: registrationFieldSwitchSchema.optional(),
				shippingAddress: registrationFieldSwitchSchema.optional(),
			})
			.optional(),
	})
	.optional()
	.transform((val) =>
		val
			? resolveRegistrationFieldConfig(
					val as Partial<RegistrationFieldConfig> | null | undefined,
				)
			: undefined,
	);

const submissionFormFieldSchema = z.object({
	key: z.string(),
	label: z.string(),
	type: z.enum([
		"text",
		"textarea",
		"url",
		"phone",
		"email",
		"image",
		"file",
		"select",
		"radio",
		"checkbox",
	]),
	required: z.boolean(),
	placeholder: z.string().optional(),
	description: z.string().optional(),
	options: z.array(z.string()).optional(),
	order: z.number(),
});

const submissionFormSettingsSchema = z
	.object({
		attachmentsEnabled: z.boolean().optional(),
		communityUseAuthorizationEnabled: z.boolean().optional(),
	})
	.optional();

const submissionFormConfigSchema = z
	.object({
		fields: z.array(submissionFormFieldSchema).optional(),
		settings: submissionFormSettingsSchema,
	})
	.nullable()
	.optional();

const validateEventContent = createContentValidator({
	title: { type: ContentType.EVENT_TITLE, skipIfEmpty: false },
	shortDescription: { type: ContentType.EVENT_SHORT_DESCRIPTION },
	richContent: { type: ContentType.EVENT_RICH_CONTENT, skipIfEmpty: false },
});

type EventEmailRecipient = {
	email: string;
	name: string;
	locale?: string | null;
};

const DEFAULT_UPDATE_STATUSES: RegistrationStatus[] = [
	"APPROVED",
	"WAITLISTED",
	"PENDING",
];

const EVENT_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
};

function inferLocaleCode(locale?: string | null): Locale | undefined {
	if (!locale) {
		return undefined;
	}
	const normalized = locale.toLowerCase();
	if (normalized.startsWith("zh")) {
		return "zh";
	}
	if (normalized.startsWith("en")) {
		return "en";
	}
	return undefined;
}

// Helper function to generate proper absolute URLs for emails
const generateEventUrl = (eventId: string, locale?: string) => {
	const getBaseUrlForEmail = () => {
		// Try multiple environment variables in order of preference
		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
		const appUrl = process.env.NEXT_PUBLIC_APP_URL;
		const vercelUrl = process.env.VERCEL_URL;
		const nodeEnv = process.env.NODE_ENV;

		if (siteUrl && siteUrl.trim() !== "") {
			return siteUrl.trim().replace(/\/$/, ""); // Remove trailing slash
		}

		if (appUrl && appUrl.trim() !== "") {
			return appUrl.trim().replace(/\/$/, ""); // Remove trailing slash
		}

		if (vercelUrl && vercelUrl.trim() !== "") {
			return `https://${vercelUrl.trim().replace(/\/$/, "")}`;
		}

		// Development fallback
		if (nodeEnv === "development") {
			return "http://localhost:3000";
		}

		// Production fallback - always return a valid URL in production
		// Default to a production URL or throw error if not configured
		console.error(
			"ERROR: No base URL configured for email links. Please set NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL environment variable. Using fallback.",
		);
		// Provide a reasonable default instead of empty string to prevent broken links
		return "https://community.hackathonwe.ink";
	};

	const baseUrl = getBaseUrlForEmail();
	const localePrefix = locale === "en" ? "en" : "zh";

	// Always return an absolute URL to avoid relative URL issues in emails
	return `${baseUrl}/${localePrefix}/events/${eventId}`;
};

function formatEventDateForLocale(date: Date, locale?: Locale | string | null) {
	const lang = locale?.toString().toLowerCase().startsWith("en")
		? "en-US"
		: "zh-CN";
	return new Intl.DateTimeFormat(lang, EVENT_DATE_FORMAT_OPTIONS).format(
		date,
	);
}

function formatEventLocationDisplay(event: {
	isOnline: boolean;
	onlineUrl?: string | null;
	address?: string | null;
}) {
	const onlineFallback = {
		zh: "线上活动",
		en: "Online Event",
	};
	const offlineFallback = {
		zh: "地点待定",
		en: "Location TBD",
	};

	if (event.isOnline) {
		const url = event.onlineUrl?.trim();
		if (url) {
			return { zh: url, en: url };
		}
		return onlineFallback;
	}

	const address = event.address?.trim();
	if (address) {
		return { zh: address, en: address };
	}
	return offlineFallback;
}

async function resolveEventHostContext(event: Event) {
	if (event.organizationId) {
		const organization = await db.organization.findUnique({
			where: { id: event.organizationId },
			select: { name: true },
		});

		return {
			hostName: organization?.name ?? "活动主办方",
			organizationId: event.organizationId,
			hostUserId: undefined as string | undefined,
		};
	}

	const organizer = await db.user.findUnique({
		where: { id: event.organizerId },
		select: { name: true },
	});

	return {
		hostName: organizer?.name ?? "活动主办方",
		organizationId: undefined as string | undefined,
		hostUserId: event.organizerId,
	};
}

async function notifyHostSubscribersOfNewEvent(params: {
	event: Event;
	hostName: string;
	organizationId?: string;
	hostUserId?: string;
	excludeUserIds?: string[];
}) {
	const { event, hostName, organizationId, hostUserId, excludeUserIds } =
		params;

	try {
		console.log("Fetching subscribers for:", {
			organizationId,
			hostUserId,
			excludeUserIds,
		});

		const subscribers = await getActiveEventHostSubscribers({
			organizationId,
			hostUserId,
			excludeUserIds,
		});

		console.log("Found subscribers:", {
			count: subscribers.length,
			subscribers: subscribers.map((s) => ({
				userId: s.userId,
				email: s.email,
				name: s.name,
				locale: s.locale,
			})),
		});

		if (subscribers.length === 0) {
			console.log("No subscribers found, skipping email notifications");
			return;
		}

		const eventLocationDisplay = formatEventLocationDisplay(event);

		console.log("Sending email notifications to subscribers...");
		const emailPromises = subscribers.map((subscriber) => {
			const locale = inferLocaleCode(subscriber.locale);
			const eventDate = formatEventDateForLocale(event.startTime, locale);
			const eventLocation =
				locale === "en"
					? eventLocationDisplay.en
					: eventLocationDisplay.zh;

			// Generate proper event URL for email
			const eventUrl = generateEventUrl(event.id, locale);

			console.log(
				`Sending email to ${subscriber.email} (${subscriber.name}) with URL: ${eventUrl}`,
			);

			return sendEventHostNewEventAnnouncement({
				eventTitle: event.title,
				eventDate,
				eventLocation,
				eventUrl,
				hostName,
				userEmail: subscriber.email,
				locale,
			});
		});

		const results = await Promise.allSettled(emailPromises);
		console.log(
			"Email sending results:",
			results.map((result, index) => ({
				subscriberIndex: index,
				status: result.status,
				reason:
					result.status === "rejected" ? result.reason : undefined,
			})),
		);
	} catch (error) {
		console.error("Failed to notify subscribers about new event:", error);
	}
}

function buildBilingualMessage(zhText: string, enText: string): string {
	return `${zhText}\n${enText}`;
}

async function getEventEmailRecipients(
	eventId: string,
	statuses: RegistrationStatus[] = DEFAULT_UPDATE_STATUSES,
): Promise<{ recipients: EventEmailRecipient[]; skipped: number }> {
	const registrations = await db.eventRegistration.findMany({
		where: {
			eventId,
			status: { in: statuses },
		},
		select: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					locale: true,
				},
			},
		},
	});

	const recipients = new Map<string, EventEmailRecipient>();
	let skipped = 0;

	for (const registration of registrations) {
		const user = registration.user;
		if (!user) {
			continue;
		}
		if (!isSendableEmail(user.email)) {
			skipped++;
			continue;
		}
		const email = user.email!.trim();
		const key = email.toLowerCase();
		if (recipients.has(key)) {
			continue;
		}

		recipients.set(key, {
			email,
			name: user.name?.trim() || email,
			locale: user.locale,
		});
	}

	return { recipients: Array.from(recipients.values()), skipped };
}

const eventSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		richContent: z.string().min(1, "Description is required"),
		shortDescription: z
			.string()
			.max(200, "Short description must be at most 200 characters")
			.optional()
			.transform((val) => {
				if (val === undefined) {
					return undefined;
				}
				const trimmed = val.trim();
				return trimmed === "" ? undefined : trimmed;
			}),
		type: z.enum(["MEETUP", "HACKATHON", "BUILDING_PUBLIC"]),
		startTime: z.string().transform((val) => new Date(val)),
		endTime: z.string().transform((val) => new Date(val)),
		isOnline: z.boolean(),
		address: z.string().optional(),
		organizationId: z.string().optional().nullable(),
		onlineUrl: z
			.string()
			.optional()
			.transform((val) => val || undefined),
		isExternalEvent: z.boolean().default(false),
		externalUrl: z
			.string()
			.optional()
			.transform((val) => val || undefined),
		maxAttendees: z.number().positive().optional(),
		registrationDeadline: z
			.string()
			.optional()
			.transform((val) => (val ? new Date(val) : undefined)),
		requireApproval: z.boolean().default(false),
		registrationSuccessInfo: z.string().optional(),
		registrationSuccessImage: z.string().optional(),
		registrationPendingInfo: z.string().optional(),
		registrationPendingImage: z.string().optional(),
		requireProjectSubmission: z.boolean().default(false), // 作品关联设置
		askDigitalCardConsent: z.boolean().default(false), // 数字名片公开确认
		coverImage: z
			.string()
			.optional()
			.transform((val) => (val && val.trim() !== "" ? val : undefined)),
		tags: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
		status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"), // 新增status字段
		questions: z
			.array(
				z.object({
					question: z.string().min(1, "Question is required"),
					description: z.string().optional(),
					type: z.enum([
						"TEXT",
						"TEXTAREA",
						"SELECT",
						"CHECKBOX",
						"RADIO",
					]),
					required: z.boolean(),
					options: z.array(z.string()).optional(),
					order: z.number().int().min(0).optional(),
				}),
			)
			.default([]),
		ticketTypes: z
			.array(
				z.object({
					name: z.string().min(1, "Ticket type name is required"),
					description: z.string().optional(),
					price: z.number().min(0).optional().nullable(),
					maxQuantity: z.number().min(1).optional().nullable(),
					isActive: z.boolean().default(true),
					sortOrder: z.number().default(0),
				}),
			)
			.default([]),
		volunteerRoles: z
			.array(
				z.object({
					volunteerRoleId: z.string(),
					recruitCount: z.number().min(1),
					description: z.string().optional(),
					requireApproval: z.boolean().default(true),
				}),
			)
			.default([]),
		volunteerContactInfo: z.string().optional(),
		volunteerWechatQrCode: z.string().optional(),
		organizerContact: z.string().optional(),
		// Building Public 特有字段
		minCheckIns: z.number().min(1).max(50).optional(),
		depositAmount: z.number().min(0).optional(),
		refundRate: z.number().min(0).max(1).optional(),
		paymentType: z.enum(["NONE", "CUSTOM"]).default("NONE"),
		paymentUrl: z.string().optional(),
		paymentQRCode: z.string().optional(),
		paymentNote: z.string().optional(),
		hackathonConfig: HackathonConfigSchema.optional(),
		registrationFieldConfig: registrationFieldConfigSchema,
		submissionFormConfig: submissionFormConfigSchema,
	})
	.refine(
		(data) => {
			// Validate end time is after start time
			return data.endTime > data.startTime;
		},
		{
			message: "End time must be after start time",
			path: ["endTime"],
		},
	)
	.refine(
		(data) => {
			// For Building Public events, validate required fields
			if (data.type === "BUILDING_PUBLIC") {
				const hasMinCheckIns =
					typeof data.minCheckIns === "number" &&
					data.minCheckIns > 0;
				const hasValidRefundRate =
					typeof data.refundRate === "number" &&
					data.refundRate >= 0 &&
					data.refundRate <= 1;
				return hasMinCheckIns && hasValidRefundRate;
			}
			return true;
		},
		{
			message:
				"Building Public events require minCheckIns (1-50) and refundRate (0-1)",
			path: ["minCheckIns"],
		},
	)
	.refine(
		(data) => {
			// For Building Public events with deposit, validate payment fields
			if (
				data.type === "BUILDING_PUBLIC" &&
				data.depositAmount &&
				data.depositAmount > 0
			) {
				if (data.paymentType === "NONE") {
					return false;
				}
				// If payment type is CUSTOM, require either URL or QR code
				if (
					data.paymentType === "CUSTOM" &&
					!data.paymentUrl &&
					!data.paymentQRCode
				) {
					return false;
				}
			}
			return true;
		},
		{
			message:
				"Building Public events with deposit require payment method (URL or QR code)",
			path: ["paymentType"],
		},
	)
	.refine(
		(data) => {
			// For offline events, address is required
			if (!data.isOnline) {
				return data.address && data.address.trim() !== "";
			}
			return true;
		},
		{
			message: "Address is required for offline events",
			path: ["address"],
		},
	)
	.refine(
		(data) => {
			// For external events, external URL is required
			if (data.isExternalEvent) {
				return data.externalUrl;
			}
			return true;
		},
		{
			message: "External URL is required for external events",
			path: ["externalUrl"],
		},
	)
	.refine(
		(data) => {
			// Registration deadline should be before start time
			if (data.registrationDeadline) {
				return data.registrationDeadline < data.startTime;
			}
			return true;
		},
		{
			message: "Registration deadline must be before event start time",
			path: ["registrationDeadline"],
		},
	)
	.refine(
		(data) => {
			// Validate URLs if provided
			if (data.onlineUrl) {
				try {
					new URL(data.onlineUrl);
					return true;
				} catch {
					return false;
				}
			}
			return true;
		},
		{
			message: "Online URL must be a valid URL",
			path: ["onlineUrl"],
		},
	)
	.refine(
		(data) => {
			// Validate external URLs if provided
			if (data.externalUrl) {
				try {
					new URL(data.externalUrl);
					return true;
				} catch {
					return false;
				}
			}
			return true;
		},
		{
			message: "External URL must be a valid URL",
			path: ["externalUrl"],
		},
	);

const updateEventSchema = z.object({
	title: z.string().min(1, "Title is required").optional(),
	richContent: z.string().min(1, "Description is required").optional(),
	shortDescription: z.string().max(200).optional(),
	type: z.enum(["MEETUP", "HACKATHON", "BUILDING_PUBLIC"]).optional(),
	status: z
		.enum([
			"DRAFT",
			"PUBLISHED",
			"REGISTRATION_CLOSED",
			"ONGOING",
			"COMPLETED",
			"CANCELLED",
		])
		.optional(),
	startTime: z
		.string()
		.transform((val) => new Date(val))
		.optional(),
	endTime: z
		.string()
		.transform((val) => new Date(val))
		.optional(),
	isOnline: z.boolean().optional(),
	address: z.string().optional(),
	organizationId: z.string().optional().nullable(),
	onlineUrl: z
		.string()
		.optional()
		.transform((val) => val?.trim() || undefined)
		.refine((val) => {
			if (val && val !== "") {
				try {
					new URL(val);
					return true;
				} catch {
					return false;
				}
			}
			return true;
		}, "Online URL must be a valid URL"),
	isExternalEvent: z.boolean().optional(),
	externalUrl: z
		.string()
		.optional()
		.transform((val) => val?.trim() || undefined)
		.refine((val) => {
			if (val && val !== "") {
				try {
					new URL(val);
					return true;
				} catch {
					return false;
				}
			}
			return true;
		}, "External URL must be a valid URL"),
	maxAttendees: z.number().positive().optional(),
	registrationDeadline: z
		.string()
		.transform((val) => (val ? new Date(val) : undefined))
		.optional(),
	requireApproval: z.boolean().optional(),
	registrationSuccessInfo: z.string().optional(),
	registrationSuccessImage: z.string().optional(),
	registrationPendingInfo: z.string().optional(),
	registrationPendingImage: z.string().optional(),
	requireProjectSubmission: z.boolean().optional(), // 作品关联设置
	askDigitalCardConsent: z.boolean().optional(), // 数字名片公开确认
	coverImage: z.string().optional(),
	tags: z.array(z.string()).optional(),
	featured: z.boolean().optional(),
	ticketTypes: z
		.array(
			z.object({
				id: z.string().optional(), // 用于更新现有票种
				name: z.string().min(1, "Ticket type name is required"),
				description: z.string().optional(),
				price: z.number().min(0).optional().nullable(),
				maxQuantity: z.number().min(1).optional().nullable(),
				isActive: z.boolean().default(true),
				sortOrder: z.number().default(0),
			}),
		)
		.optional(),
	volunteerRoles: z
		.array(
			z.object({
				volunteerRoleId: z.string(),
				recruitCount: z.number().min(1),
				description: z.string().optional(),
				requireApproval: z.boolean().default(true),
			}),
		)
		.optional(),
	volunteerContactInfo: z.string().optional(),
	volunteerWechatQrCode: z.string().optional(),
	organizerContact: z.string().optional(),
	// Building Public 特有字段
	minCheckIns: z.number().min(1).max(50).optional(),
	depositAmount: z.number().min(0).optional(),
	refundRate: z.number().min(0).max(1).optional(),
	paymentType: z.enum(["NONE", "CUSTOM"]).optional(),
	paymentUrl: z.string().optional(),
	paymentQRCode: z.string().optional(),
	paymentNote: z.string().optional(),
	hackathonConfig: HackathonConfigSchema.optional(),
	questions: z
		.array(
			z.object({
				id: z.string().optional(),
				question: z.string().min(1, "Question is required"),
				description: z.string().optional(),
				type: z.enum([
					"TEXT",
					"TEXTAREA",
					"SELECT",
					"CHECKBOX",
					"RADIO",
				]),
				required: z.boolean().optional().default(false),
				options: z.array(z.string()).optional(),
				order: z.number().int().min(0).optional(),
			}),
		)
		.optional(),
	registrationFieldConfig: registrationFieldConfigUpdateSchema,
	submissionFormConfig: submissionFormConfigSchema,
});

const getEventsSchema = z.object({
	page: z
		.string()
		.transform((val) => Number.parseInt(val) || 1)
		.optional(),
	limit: z
		.string()
		.transform((val) => Number.parseInt(val) || 20)
		.optional(),
	type: z.enum(["MEETUP", "HACKATHON", "BUILDING_PUBLIC"]).optional(),
	organizationId: z.string().optional().nullable(),
	isOnline: z
		.string()
		.transform((val) => val === "true")
		.optional(),
	isExternalEvent: z
		.string()
		.transform((val) => val === "true")
		.optional(),
	status: z
		.enum([
			"DRAFT",
			"PUBLISHED",
			"REGISTRATION_CLOSED",
			"ONGOING",
			"COMPLETED",
			"CANCELLED",
		])
		.optional(),
	search: z.string().optional(),
	featured: z
		.string()
		.transform((val) => val === "true")
		.optional(),
	startDate: z
		.string()
		.transform((val) => (val ? new Date(val) : undefined))
		.optional(),
	endDate: z
		.string()
		.transform((val) => (val ? new Date(val) : undefined))
		.optional(),
	tags: z
		.string()
		.transform((val) => (val ? val.split(",") : undefined))
		.optional(),
	showExpired: z
		.string()
		.transform((val) => val === "true")
		.optional(),
	hostType: z.enum(["organization", "individual", "all"]).optional(),
});

const app = new Hono()
	.route("/", registrationsRouter)
	.route("/", eventPhotosRouter)
	.route("/", eventTicketTypesRouter)
	.route("/", eventAdminRouter)
	.route("/", eventInvitesRouter)
	.route("/", eventLikesRouter)
	.route("/:eventId/checkin", checkinRouter)
	.route("/:eventId/feedback", feedbackRouter)
	.route("/:eventId/participants", participantsRouter)
	.route("/:eventId/volunteers", volunteersRouter)
	.route("/:eventId/volunteer-admin", volunteerAdminRouter)
	.route("/:eventId/participant-interests", participantInterestsRouter)
	.route("/status", statusRouter);

// Helper function to get event with admin check
async function getEventWithAdminCheck(eventId: string, headers: Headers) {
	const event = await getEventById(eventId);

	if (!event) {
		return null;
	}

	// Check if current user is admin of this event
	let isEventAdmin = false;
	try {
		const session = await auth.api.getSession({ headers });

		if (session?.user?.id) {
			const { canManageEvent } = await import("@/features/permissions");
			isEventAdmin = await canManageEvent(eventId, session.user.id);
		}
	} catch (adminCheckError) {
		// Log error but don't fail the request
		console.error("Error checking admin status:", adminCheckError);
	}

	return {
		...event,
		isEventAdmin,
	};
}

// GET /api/events/:eventId/my-feedback - Get current user's feedback for an event
app.get("/:eventId/my-feedback", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json({
				success: true,
				data: null,
			});
		}

		const eventId = c.req.param("eventId");

		// Get user's feedback for this event
		const feedback = await db.eventFeedback.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId: session.user.id,
				},
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
			},
		});

		return c.json({
			success: true,
			data: feedback,
		});
	} catch (error) {
		console.error("Error fetching user feedback:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch user feedback",
			},
			500,
		);
	}
});

// GET /api/events - Get events list
app.get("/", zValidator("query", getEventsSchema), async (c) => {
	try {
		const params = c.req.valid("query");
		// Convert null to undefined for organizationId
		const result = await getEvents({
			...params,
			organizationId:
				params.organizationId === null
					? undefined
					: params.organizationId,
			hostType: params.hostType === "all" ? undefined : params.hostType,
		});

		// 设置强制不缓存的响应头，防止 CDN 缓存
		c.header(
			"Cache-Control",
			"no-cache, no-store, must-revalidate, private, max-age=0",
		);
		c.header("Pragma", "no-cache");
		c.header("Expires", "0");
		c.header("Surrogate-Control", "no-store"); // 用于 EdgeOne 等 CDN

		return c.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Error fetching events:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch events",
			},
			500,
		);
	}
});

// POST /api/events - Create new event (requires authentication)
app.post("/", async (c) => {
	try {
		// Manual validation with better error handling
		const body = await c.req.json();

		const validationResult = eventSchema.safeParse(body);

		if (!validationResult.success) {
			console.error("Validation failed:", validationResult.error);
			return c.json(
				{
					success: false,
					error: "Validation failed",
					details: validationResult.error.issues,
				},
				400,
			);
		}

		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		// Check L0 user (VISITOR) permissions
		const { db } = await import("@/lib/database/prisma/client");
		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { membershipLevel: true },
		});

		if (!user) {
			return c.json(
				{
					success: false,
					error: "User not found",
				},
				404,
			);
		}

		const restrictions = await getVisitorRestrictionsConfig();
		const membership = { membershipLevel: user.membershipLevel };
		const { allowed, reason } = canUserDoAction(
			membership,
			RestrictedAction.CREATE_EVENT,
			restrictions,
		);

		if (!allowed) {
			return c.json(
				{
					success: false,
					error:
						reason ??
						"创建活动需要成为共创伙伴，请联系社区负责人！",
				},
				403,
			);
		}

		const data = validationResult.data;

		// 内容安全审核
		const moderationResult = await validateEventContent({
			title: data.title,
			shortDescription: data.shortDescription,
			richContent: data.richContent,
		});

		if (!moderationResult.isValid) {
			console.warn("Event creation content moderation failed:", {
				eventData: {
					title: data.title,
				},
				errors: moderationResult.errors,
				userId: session.user.id,
			});
			return c.json(
				{
					success: false,
					error: "内容审核未通过",
					details: moderationResult.errors,
				},
				400,
			);
		}

		const imageFieldsForCreate: Array<{
			value?: string;
			name: string;
		}> = [
			{ value: data.coverImage, name: "event_cover_image" },
			{
				value: data.registrationSuccessImage,
				name: "event_registration_success_image",
			},
			{
				value: data.registrationPendingImage,
				name: "event_registration_pending_image",
			},
			{
				value: data.volunteerWechatQrCode,
				name: "event_volunteer_wechat_qrcode",
			},
			{ value: data.paymentQRCode, name: "event_payment_qrcode" },
		];

		for (const field of imageFieldsForCreate) {
			if (!field.value) continue;
			const moderation = await ensureImageSafe(field.value, "content", {
				skipIfEmpty: true,
			});
			if (!moderation.isApproved) {
				console.warn("Event creation image moderation failed", {
					userId: session.user.id,
					field: field.name,
					value: field.value,
					result: moderation.result,
				});
				return c.json(
					{
						success: false,
						error: moderation.reason ?? "活动图片未通过审核",
					},
					400,
				);
			}
		}

		// Normalize organizationId: collapse null/empty values so Prisma sees undefined
		const cleanedData = {
			...data,
			organizationId:
				data.organizationId === null || data.organizationId === ""
					? undefined
					: data.organizationId,
		};

		const {
			hackathonConfig,
			submissionFormConfig,
			registrationFieldConfig,
			...restEventData
		} = cleanedData;

		// If organizationId is provided, verify user has access to create events for this organization
		if (restEventData.organizationId) {
			const membership = await getOrganizationMembership(
				restEventData.organizationId,
				session.user.id,
			);
			if (!membership) {
				return c.json(
					{
						success: false,
						error: "You don't have permission to create events for this organization",
					},
					403,
				);
			}
		}

		const normalizedHackathonConfig =
			restEventData.type === "HACKATHON"
				? withHackathonConfigDefaults(hackathonConfig, {
						changedBy: session.user.id,
					})
				: undefined;
		const normalizedSubmissionFormConfig =
			restEventData.type === "HACKATHON"
				? (submissionFormConfig as unknown as Prisma.InputJsonValue | null)
				: undefined;

		const event = await createEvent({
			...restEventData,
			organizerId: session.user.id,
			registrationFieldConfig:
				registrationFieldConfig as unknown as Prisma.InputJsonValue,
			submissionFormConfig: normalizedSubmissionFormConfig,
			hackathonConfig:
				restEventData.type === "HACKATHON" && normalizedHackathonConfig
					? (normalizedHackathonConfig as unknown as Prisma.InputJsonValue)
					: undefined,
		});

		if (event.status === "PUBLISHED") {
			const hostContext = await resolveEventHostContext(event);
			const excludeUserIds = Array.from(
				new Set([session.user.id, event.organizerId].filter(Boolean)),
			);

			// 添加调试日志
			console.log("Event created - notifying subscribers:", {
				eventId: event.id,
				eventTitle: event.title,
				hasOrganization: !!event.organizationId,
				organizationId: hostContext.organizationId,
				hostUserId: hostContext.hostUserId,
				hostName: hostContext.hostName,
				excludeUserIds,
			});

			await notifyHostSubscribersOfNewEvent({
				event,
				hostName: hostContext.hostName,
				organizationId: hostContext.organizationId,
				hostUserId: hostContext.hostUserId,
				excludeUserIds,
			});
		}

		return c.json({
			success: true,
			data: event,
		});
	} catch (error) {
		console.error("Error creating event:", error);

		// Better error handling for Zod validation errors
		if (error instanceof Error) {
			return c.json(
				{
					success: false,
					error: error.message,
				},
				500,
			);
		}

		// Handle unknown errors
		return c.json(
			{
				success: false,
				error: "Failed to create event",
			},
			500,
		);
	}
});

// GET /api/events/organizations - Get organizations for events filtering
app.get("/organizations", async (c) => {
	try {
		const organizations = await db.organization.findMany({
			where: {
				isPublic: true,
				events: {
					some: {
						status: "PUBLISHED",
					},
				},
			},
			select: {
				id: true,
				name: true,
				slug: true,
				logo: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		return c.json({
			success: true,
			data: {
				organizations,
			},
		});
	} catch (error) {
		console.error("Error fetching organizations:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch organizations",
			},
			500,
		);
	}
});

// GET /api/events/:id - Get event by ID
app.get("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const eventWithAdminCheck = await getEventWithAdminCheck(
			id,
			c.req.raw.headers,
		);

		if (!eventWithAdminCheck) {
			// Check if this is a browser request (not an API call)
			const acceptHeader = c.req.header("Accept") || "";
			const userAgent = c.req.header("User-Agent") || "";
			const isBrowserRequest =
				acceptHeader.includes("text/html") ||
				userAgent.includes("Mozilla");

			if (isBrowserRequest) {
				// Redirect to the correct page route which will show proper 404 page
				const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
				const redirectUrl = appUrl
					? `${appUrl}/events/${id}`
					: `/events/${id}`;
				return c.redirect(redirectUrl, 302);
			}

			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		return c.json({
			success: true,
			data: eventWithAdminCheck,
		});
	} catch (error) {
		console.error("Error fetching event:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch event",
			},
			500,
		);
	}
});

// GET /api/events/:id/detail - Alias for event by ID (for backward compatibility)
app.get("/:id/detail", async (c) => {
	try {
		const id = c.req.param("id");
		const eventWithAdminCheck = await getEventWithAdminCheck(
			id,
			c.req.raw.headers,
		);

		if (!eventWithAdminCheck) {
			// Check if this is a browser request (not an API call)
			const acceptHeader = c.req.header("Accept") || "";
			const userAgent = c.req.header("User-Agent") || "";
			const isBrowserRequest =
				acceptHeader.includes("text/html") ||
				userAgent.includes("Mozilla");

			if (isBrowserRequest) {
				// Redirect to the correct page route which will show proper 404 page
				const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
				const redirectUrl = appUrl
					? `${appUrl}/events/${id}`
					: `/events/${id}`;
				return c.redirect(redirectUrl, 302);
			}

			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		return c.json({
			success: true,
			data: eventWithAdminCheck,
		});
	} catch (error) {
		console.error("Error fetching event:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch event",
			},
			500,
		);
	}
});

// POST /api/events/:id/view - Increment event view count (without returning full payload)
app.post("/:id/view", async (c) => {
	try {
		const id = c.req.param("id");
		const event = await getEventById(id);

		if (!event) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}
		const updatedEvent = await incrementEventViewCount(id);

		return c.json({
			success: true,
			data: {
				viewCount: updatedEvent.viewCount,
			},
		});
	} catch (error) {
		console.error("Error incrementing event view count:", error);
		return c.json(
			{
				success: false,
				error: "Failed to increment view count",
			},
			500,
		);
	}
});

// PUT /api/events/:id - Update event (requires authentication and ownership)
app.put("/:id", zValidator("json", updateEventSchema), async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const id = c.req.param("id");
		const data = c.req.valid("json");

		// 内容安全审核
		const moderationResult = await validateEventContent({
			title: data.title,
			richContent: data.richContent,
			shortDescription: data.shortDescription,
		});

		if (!moderationResult.isValid) {
			console.warn("Event update content moderation failed:", {
				eventId: id,
				eventData: {
					title: data.title,
				},
				errors: moderationResult.errors,
				userId: session.user.id,
			});
			return c.json(
				{
					success: false,
					error: "内容审核未通过",
					details: moderationResult.errors,
				},
				400,
			);
		}

		// Normalize organizationId: keep explicit nulls so hosts can be cleared, but drop empty strings
		const cleanedData = {
			...data,
			organizationId:
				data.organizationId === "" ? null : data.organizationId,
		};

		const { hackathonConfig, submissionFormConfig, ...restUpdateData } =
			cleanedData;

		const imageFieldsForUpdate: Array<{
			value?: string;
			name: string;
		}> = [
			{ value: cleanedData.coverImage, name: "event_cover_image" },
			{
				value: cleanedData.registrationSuccessImage,
				name: "event_registration_success_image",
			},
			{
				value: cleanedData.registrationPendingImage,
				name: "event_registration_pending_image",
			},
			{
				value: cleanedData.volunteerWechatQrCode,
				name: "event_volunteer_wechat_qrcode",
			},
			{ value: cleanedData.paymentQRCode, name: "event_payment_qrcode" },
		];

		for (const field of imageFieldsForUpdate) {
			if (field.value === undefined) continue;
			const moderation = await ensureImageSafe(field.value, "content", {
				skipIfEmpty: true,
			});
			if (!moderation.isApproved) {
				console.warn("Event update image moderation failed", {
					userId: session.user.id,
					eventId: id,
					field: field.name,
					value: field.value,
					result: moderation.result,
				});
				return c.json(
					{
						success: false,
						error: moderation.reason ?? "活动图片未通过审核",
					},
					400,
				);
			}
		}

		// Check if user owns the event
		const existingEvent = await getEventById(id);
		if (!existingEvent) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		// Check if user has permission to update this event
		// Use canManageEvent function which checks all permission types:
		// 1. Event creator
		// 2. Event admins with canEditEvent permission
		// 3. Organization owners/admins
		const { canManageEvent } = await import("@/features/permissions");
		const hasPermission = await canManageEvent(id, session.user.id);

		if (!hasPermission) {
			return c.json(
				{
					success: false,
					error: "Not authorized to update this event",
				},
				403,
			);
		}

		// If updating organizationId, verify user has access to the new organization
		if (
			restUpdateData.organizationId &&
			restUpdateData.organizationId !== existingEvent.organizationId
		) {
			const membership = await getOrganizationMembership(
				restUpdateData.organizationId,
				session.user.id,
			);
			if (!membership) {
				return c.json(
					{
						success: false,
						error: "You don't have permission to move this event to the specified organization",
					},
					403,
				);
			}
		}

		const targetType = restUpdateData.type ?? existingEvent.type;
		const typeChangedToHackathon =
			existingEvent.type !== "HACKATHON" && targetType === "HACKATHON";
		const hackathonControlDefaults = typeChangedToHackathon
			? {
					// When switching an existing event into hackathon mode, default submissions/voting to open
					submissionsOpen: true,
					votingOpen: true,
				}
			: undefined;
		const normalizedHackathonConfig =
			hackathonConfig !== undefined
				? targetType === "HACKATHON"
					? withHackathonConfigDefaults(hackathonConfig, {
							changedBy: session.user.id,
						})
					: null
				: undefined;
		const normalizedSubmissionFormConfig =
			submissionFormConfig !== undefined
				? targetType === "HACKATHON"
					? (submissionFormConfig as unknown as Prisma.InputJsonValue | null)
					: null
				: undefined;

		const updatedEvent = await updateEvent(id, {
			...restUpdateData,
			...(restUpdateData.registrationFieldConfig !== undefined && {
				registrationFieldConfig:
					restUpdateData.registrationFieldConfig as unknown as Prisma.InputJsonValue,
			}),
			...(hackathonControlDefaults ?? {}),
			...(normalizedHackathonConfig !== undefined && {
				hackathonConfig:
					normalizedHackathonConfig === null
						? null
						: (normalizedHackathonConfig as unknown as Prisma.InputJsonValue),
			}),
			...(normalizedSubmissionFormConfig !== undefined && {
				submissionFormConfig: normalizedSubmissionFormConfig,
			}),
		});

		const updatedStartTime =
			restUpdateData.startTime ?? existingEvent.startTime;
		const startTimeChanged =
			restUpdateData.startTime !== undefined &&
			existingEvent.startTime.getTime() !==
				restUpdateData.startTime.getTime();
		const isOnlineChanged =
			restUpdateData.isOnline !== undefined &&
			restUpdateData.isOnline !== existingEvent.isOnline;
		const addressChanged =
			restUpdateData.address !== undefined &&
			restUpdateData.address !== existingEvent.address;
		const onlineUrlChanged =
			restUpdateData.onlineUrl !== undefined &&
			restUpdateData.onlineUrl !== existingEvent.onlineUrl;
		const locationChanged =
			isOnlineChanged || addressChanged || onlineUrlChanged;
		const statusChangedToCancelled =
			restUpdateData.status === "CANCELLED" &&
			existingEvent.status !== "CANCELLED";
		const statusChangedToPublished =
			restUpdateData.status === "PUBLISHED" &&
			existingEvent.status !== "PUBLISHED";

		// 检查是否有时间变更，如果有则通知已报名用户
		if (startTimeChanged) {
			try {
				// 获取已报名的用户列表
				const registrations = await db.eventRegistration.findMany({
					where: {
						eventId: id,
						status: { in: ["APPROVED", "WAITLISTED"] },
					},
					select: { userId: true },
				});

				if (registrations.length > 0) {
					const userIds = registrations.map((reg) => reg.userId);
					await NotificationService.notifyEventTimeChange(
						userIds,
						id,
						updatedEvent.title,
						updatedStartTime,
					);
				}
			} catch (notificationError) {
				console.error(
					"Error sending event time change notification:",
					notificationError,
				);
				// 通知发送失败不影响活动更新
			}
		}

		const shouldSendUpdateEmail =
			startTimeChanged || locationChanged || statusChangedToCancelled;

		if (shouldSendUpdateEmail) {
			try {
				const { recipients } = await getEventEmailRecipients(id);
				if (recipients.length > 0) {
					const updateMessageParts: string[] = [];

					if (statusChangedToCancelled) {
						updateMessageParts.push(
							buildBilingualMessage(
								"活动已取消，请留意后续通知。",
								"The event has been cancelled. Please stay tuned for updates.",
							),
						);
					} else {
						if (startTimeChanged) {
							const newTimeZh = formatEventDateForLocale(
								new Date(updatedStartTime),
								"zh",
							);
							const newTimeEn = formatEventDateForLocale(
								new Date(updatedStartTime),
								"en",
							);
							const oldTimeZh = formatEventDateForLocale(
								existingEvent.startTime,
								"zh",
							);
							const oldTimeEn = formatEventDateForLocale(
								existingEvent.startTime,
								"en",
							);
							updateMessageParts.push(
								buildBilingualMessage(
									`活动时间更新为 ${newTimeZh}（原时间：${oldTimeZh}）`,
									`The event time has been updated to ${newTimeEn} (previously ${oldTimeEn}).`,
								),
							);
						}

						if (locationChanged) {
							const newLocation =
								formatEventLocationDisplay(updatedEvent);
							const oldLocation =
								formatEventLocationDisplay(existingEvent);
							updateMessageParts.push(
								buildBilingualMessage(
									`活动地点更新为 ${newLocation.zh}（原地点：${oldLocation.zh}）`,
									`The event location has been updated to ${newLocation.en} (previously ${oldLocation.en}).`,
								),
							);
						}
					}

					if (updateMessageParts.length > 0) {
						const updateType = statusChangedToCancelled
							? "CANCELLED"
							: startTimeChanged && !locationChanged
								? "TIME_CHANGE"
								: locationChanged && !startTimeChanged
									? "LOCATION_CHANGE"
									: "GENERAL_UPDATE";
						const updateDetails = updateMessageParts.join("\n\n");
						const eventLocationDisplay =
							formatEventLocationDisplay(updatedEvent);

						await Promise.all(
							recipients.map((recipient) => {
								const locale = inferLocaleCode(
									recipient.locale,
								);
								const eventUrl = generateEventUrl(
									updatedEvent.id,
									locale,
								);
								return sendEventUpdate({
									eventTitle: updatedEvent.title,
									eventDate: formatEventDateForLocale(
										new Date(updatedStartTime),
										locale,
									),
									eventLocation:
										locale === "en"
											? eventLocationDisplay.en
											: eventLocationDisplay.zh,
									eventUrl,
									userName: recipient.name,
									userEmail: recipient.email,
									updateType,
									updateDetails,
									locale,
								});
							}),
						);
					}
				}
			} catch (emailError) {
				console.error("Error sending event update emails:", emailError);
			}
		}

		if (statusChangedToPublished) {
			const hostContext = await resolveEventHostContext(updatedEvent);
			const excludeUserIds = Array.from(
				new Set(
					[session.user.id, updatedEvent.organizerId].filter(Boolean),
				),
			);
			await notifyHostSubscribersOfNewEvent({
				event: updatedEvent,
				hostName: hostContext.hostName,
				organizationId: hostContext.organizationId,
				hostUserId: hostContext.hostUserId,
				excludeUserIds,
			});
		}

		return c.json({
			success: true,
			data: updatedEvent,
		});
	} catch (error) {
		console.error("Error updating event:", error);
		return c.json(
			{
				success: false,
				error: "Failed to update event",
			},
			500,
		);
	}
});

// DELETE /api/events/:id - Delete event (requires authentication and ownership)
app.delete("/:id", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const id = c.req.param("id");

		// Check if user owns the event
		const existingEvent = await getEventById(id);
		if (!existingEvent) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		// Check if user has permission to delete this event
		// Use canManageEvent function which checks all permission types:
		// 1. Event creator
		// 2. Event admins with canEditEvent permission
		// 3. Organization owners/admins
		const { canManageEvent } = await import("@/features/permissions");
		const hasPermission = await canManageEvent(id, session.user.id);

		if (!hasPermission) {
			return c.json(
				{
					success: false,
					error: "Not authorized to delete this event",
				},
				403,
			);
		}

		// 在删除活动之前通知已报名用户
		try {
			// 获取已报名的用户列表
			const registrations = await db.eventRegistration.findMany({
				where: {
					eventId: id,
					status: { in: ["APPROVED", "WAITLISTED", "PENDING"] },
				},
				select: { userId: true },
			});

			if (registrations.length > 0) {
				const userIds = registrations.map((reg) => reg.userId);
				// 使用 EVENT_CANCELLED 通知类型
				await NotificationService.createBulkNotifications(
					userIds.map((userId) => ({
						userId,
						type: "EVENT_CANCELLED",
						title: "活动已取消",
						content: `很抱歉，活动 "${existingEvent.title}" 已被取消`,
						metadata: {
							eventId: id,
							eventTitle: existingEvent.title,
						},
						priority: "HIGH",
					})),
				);

				try {
					const { recipients } = await getEventEmailRecipients(id, [
						"APPROVED",
						"WAITLISTED",
						"PENDING",
					]);

					if (recipients.length > 0) {
						const eventLocationDisplay =
							formatEventLocationDisplay(existingEvent);
						const updateDetails = buildBilingualMessage(
							"活动已取消，请留意后续通知。",
							"The event has been cancelled. Please stay tuned for updates.",
						);

						await Promise.all(
							recipients.map((recipient) => {
								const locale = inferLocaleCode(
									recipient.locale,
								);
								const eventUrl = generateEventUrl(
									existingEvent.id,
									locale,
								);
								return sendEventUpdate({
									eventTitle: existingEvent.title,
									eventDate: formatEventDateForLocale(
										new Date(existingEvent.startTime),
										locale,
									),
									eventLocation:
										locale === "en"
											? eventLocationDisplay.en
											: eventLocationDisplay.zh,
									eventUrl,
									userName: recipient.name,
									userEmail: recipient.email,
									updateType: "CANCELLED",
									updateDetails,
									locale,
								});
							}),
						);
					}
				} catch (emailError) {
					console.error(
						"Error sending event cancellation emails:",
						emailError,
					);
				}
			}
		} catch (notificationError) {
			console.error(
				"Error sending event cancellation notification:",
				notificationError,
			);
			// 通知发送失败不影响活动删除
		}

		await deleteEvent(id);

		return c.json({
			success: true,
			message: "Event deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting event:", error);
		return c.json(
			{
				success: false,
				error: "Failed to delete event",
			},
			500,
		);
	}
}).post(
	"/:id/save-as-template",
	zValidator(
		"json",
		z.object({
			name: z.string().min(1).max(255),
			description: z.string().min(1),
			organizationId: z.string().optional(),
		}),
	),
	async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		if (!session) {
			return c.json(
				{
					success: false,
					error: "Not authenticated",
				},
				401,
			);
		}

		const eventId = c.req.param("id");
		const { name, description, organizationId } = c.req.valid("json");

		try {
			// 获取活动详情
			const event = await db.event.findUnique({
				where: { id: eventId },
				include: {
					ticketTypes: true,
					volunteerRoles: {
						include: {
							volunteerRole: true,
						},
					},
					questions: true,
				},
			});

			if (!event) {
				return c.json(
					{
						success: false,
						error: "Event not found",
					},
					404,
				);
			}

			// 检查权限
			const membership = organizationId
				? await getOrganizationMembership(
						organizationId,
						session.user.id,
					)
				: null;

			const hasPermission =
				event.organizerId === session.user.id ||
				(organizationId && membership?.role === "admin");

			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error: "Not authorized to save this event as template",
					},
					403,
				);
			}

			// 创建模板
			const template = await db.eventTemplate.create({
				data: {
					name,
					type: "CUSTOM",
					description,
					title: event.title,
					defaultDescription: event.richContent || "",
					shortDescription: event.shortDescription || "",
					duration:
						event.endTime && event.startTime
							? Math.round(
									(event.endTime.getTime() -
										event.startTime.getTime()) /
										(1000 * 60),
								)
							: null,
					maxAttendees: event.maxAttendees,
					requireApproval: event.requireApproval,
					createdBy: session.user.id,
					organizationId,
					isSystemTemplate: false,
					isActive: true,
					ticketTypes: {
						create: event.ticketTypes.map((ticketType) => ({
							name: ticketType.name,
							description: ticketType.description,
							price: ticketType.price,
							maxQuantity: ticketType.maxQuantity,
							sortOrder: ticketType.sortOrder,
						})),
					},
					volunteerRoles: {
						create: event.volunteerRoles.map((role) => ({
							volunteerRoleId: role.volunteerRoleId,
							recruitCount: role.recruitCount,
							description: role.description,
							requireApproval: role.requireApproval,
							cpReward: 0, // 默认CP奖励为0，可以后续调整
						})),
					},
					questions: {
						create: event.questions.map((question) => ({
							question: question.question,
							type: question.type,
							options: question.options,
							required: question.required,
							order: question.order,
						})),
					},
				},
				include: {
					ticketTypes: true,
					volunteerRoles: {
						include: {
							volunteerRole: true,
						},
					},
					questions: true,
				},
			});

			return c.json({
				success: true,
				data: template,
				message: "Event saved as template successfully",
			});
		} catch (error) {
			console.error("Error saving event as template:", error);
			return c.json(
				{
					success: false,
					error: "Failed to save event as template",
				},
				500,
			);
		}
	},
);

// GET /api/events/:eventId/project-submissions - Get project submissions for an event
app.get("/:eventId/project-submissions", async (c) => {
	try {
		const eventId = c.req.param("eventId");

		// Import the database query function
		const { getEventProjectSubmissions } = await import(
			"@/lib/database/prisma/queries/events"
		);

		const projectSubmissions = await getEventProjectSubmissions(eventId);

		return c.json({
			success: true,
			data: projectSubmissions,
		});
	} catch (error) {
		console.error("Error fetching event project submissions:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch project submissions",
			},
			500,
		);
	}
});

export default app;
