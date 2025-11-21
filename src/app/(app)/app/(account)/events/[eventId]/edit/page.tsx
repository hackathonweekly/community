"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCreateForm } from "@/modules/dashboard/events/components/EventCreateForm";
import type { EventFormData } from "@/modules/dashboard/events/components/types";
import { extractErrorMessage as extractTemplateErrorMessage } from "@/modules/dashboard/events/utils/template-helpers";
import { formatForDatetimeLocal } from "@/modules/dashboard/events/utils/date-utils";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useUserOrganizations } from "@/modules/dashboard/organizations/hooks/use-user-organizations";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Event {
	id: string;
	title: string;
	richContent: string;
	shortDescription?: string | null;
	contentImages?: string[];
	type: string;
	status: string;
	startTime: string;
	endTime: string;
	isOnline: boolean;
	address?: string;
	organizationId?: string;
	onlineUrl?: string;
	externalUrl?: string;
	isExternalEvent: boolean;
	maxAttendees?: number;
	registrationDeadline?: string;
	requireApproval: boolean;
	requireProjectSubmission?: boolean; // 作品关联设置
	askDigitalCardConsent?: boolean; // 数字名片公开确认
	registrationSuccessInfo?: string;
	registrationSuccessImage?: string;
	registrationPendingInfo?: string;
	registrationPendingImage?: string;
	coverImage?: string;
	tags: string[];
	// Building Public 配置
	buildingConfig?: {
		id: string;
		duration: number;
		requiredCheckIns: number;
		depositAmount: number;
		refundRate: number;
		paymentType: string;
		paymentUrl?: string;
		paymentQRCode?: string;
		paymentNote?: string;
		isPublic: boolean;
		allowAnonymous: boolean;
		enableVoting: boolean;
	};
	// Hackathon 配置
	hackathonConfig?: {
		settings?: {
			maxTeamSize: number;
			allowSolo: boolean;
			requireProject: boolean;
		};
		voting?: {
			allowPublicVoting: boolean;
			enableJudgeVoting: boolean;
			judgeWeight: number;
			publicWeight: number;
			publicVotingScope: "ALL" | "REGISTERED" | "PARTICIPANTS";
		};
	};
	volunteerContactInfo?: string;
	volunteerWechatQrCode?: string;
	organizerContact?: string;
	questions: Array<{
		id: string;
		question: string;
		description?: string;
		type: "TEXT" | "TEXTAREA" | "SELECT" | "CHECKBOX" | "RADIO";
		required: boolean;
		options: string[];
		order: number;
	}>;
	ticketTypes?: Array<{
		id: string;
		name: string;
		description?: string;
		price?: number;
		maxQuantity?: number;
		isActive: boolean;
		sortOrder: number;
	}>;
	volunteerRoles?: Array<{
		id: string;
		recruitCount: number;
		requireApproval?: boolean;
		description?: string;
		volunteerRole: {
			id: string;
			name: string;
			description: string;
			cpPoints: number;
		};
	}>;
	organizer: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	organization?: {
		id: string;
		name: string;
		slug: string;
		logo?: string;
	};
}

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
}

export default function EventEditPage() {
	const t = useTranslations("events.manage.editPage");
	const actionsT = useTranslations("events.manage.actions");
	const { user } = useSession();
	const {
		organizations,
		isLoading: organizationsLoading,
		refetchUserOrganizations,
	} = useUserOrganizations();
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [volunteerRoles, setVolunteerRoles] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchEvent = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}`);
			if (response.ok) {
				const data = await response.json();
				setEvent(data.data);
			} else {
				toast.error(actionsT("fetchError"));
				router.push("/app/events");
			}
		} catch (error) {
			console.error("Error fetching event:", error);
			toast.error(actionsT("fetchError"));
		}
	};

	const fetchOrganizations = async () => {
		// 使用 TanStack Query hook，不再需要手动 fetch
		// organizations 数据由 useUserOrganizations hook 自动管理
	};

	const fetchVolunteerRoles = async () => {
		try {
			const response = await fetch("/api/volunteer-roles");
			if (response.ok) {
				const data = await response.json();
				setVolunteerRoles(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching volunteer roles:", error);
		}
	};

	const handleSubmit = async (
		formData: any,
		status: "DRAFT" | "PUBLISHED" = "PUBLISHED",
	) => {
		setIsSubmitting(true);

		try {
			const dataWithStatus = { ...formData, status };

			const response = await fetch(`/api/events/${eventId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataWithStatus),
			});

			if (response.ok) {
				const actionText = status === "DRAFT" ? "保存为草稿" : "更新";
				toast.success(`活动${actionText}成功！`);
				router.push(`/app/events/${eventId}/manage`);
			} else {
				const error = await response.json();
				// Handle content moderation errors with more specific messaging
				if (error.details && Array.isArray(error.details)) {
					const detailMessages = error.details
						.map((detail: any) => {
							if (typeof detail === "object" && detail.message) {
								return detail.message;
							}
							return detail;
						})
						.join("; ");
					toast.error(`${error.error}: ${detailMessages}`);
				} else if (error.details && typeof error.details === "object") {
					// Handle field-specific errors from content moderation
					const fieldErrors = Object.entries(error.details)
						.map(([field, message]) => {
							const fieldName =
								field === "richContent"
									? "活动详情"
									: field === "title"
										? "活动标题"
										: field === "shortDescription"
											? "简短描述"
											: field;
							return `${fieldName}: ${message}`;
						})
						.join("; ");
					toast.error(`${error.error} - ${fieldErrors}`);
				} else {
					toast.error(error.error || actionsT("updateError"));
				}
			}
		} catch (error) {
			console.error("Error updating event:", error);
			toast.error(actionsT("updateError"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSaveAsTemplate = async (data: EventFormData) => {
		const templateName = `${data.title} - 模板`;
		const templateDescription = `基于活动"${data.title}"创建的模板`;

		try {
			const response = await fetch(
				`/api/events/${eventId}/save-as-template`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: templateName,
						description: templateDescription,
						organizationId:
							data.organizationId === "none"
								? undefined
								: data.organizationId,
					}),
				},
			);

			if (!response.ok) {
				const message = await extractTemplateErrorMessage(
					response,
					"保存模板失败",
				);
				throw new Error(message);
			}

			toast.success("模板保存成功！");
		} catch (error) {
			console.error("Error saving template:", error);
			toast.error(
				error instanceof Error ? error.message : "保存模板失败",
			);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/events/${eventId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success(actionsT("deleteSuccess"));
				router.push("/app/events");
			} else {
				const error = await response.json();
				toast.error(error.error || actionsT("deleteError"));
			}
		} catch (error) {
			console.error("Error deleting event:", error);
			toast.error(actionsT("deleteError"));
		} finally {
			setIsDeleting(false);
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			await Promise.all([
				fetchEvent(),
				// fetchOrganizations(), // 不再需要，TanStack Query 自动处理
				fetchVolunteerRoles(),
			]);
			setLoading(false);
		};

		fetchData();
	}, [eventId]);

	if (loading || organizationsLoading) {
		return (
			<div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
				<div className="max-w-4xl mx-auto">
					<Skeleton className="h-8 w-1/3 mb-2" />
					<Skeleton className="h-4 w-2/3 mb-8" />
					<div className="space-y-6">
						{[...Array(4)].map((_, i) => (
							<Card key={i}>
								<CardContent className="p-6">
									<Skeleton className="h-6 w-1/2 mb-4" />
									<div className="space-y-3">
										<Skeleton className="h-10 w-full" />
										<Skeleton className="h-20 w-full" />
										<div className="grid grid-cols-2 gap-4">
											<Skeleton className="h-10 w-full" />
											<Skeleton className="h-10 w-full" />
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-2xl font-bold mb-4">Event not found</h1>
					<Button asChild>
						<Link href="/app/events">Back to My Events</Link>
					</Button>
				</div>
			</div>
		);
	}

	// Helper function to convert UTC date to local datetime-local format
	const formatDateForInput = (dateString: string) => {
		const date = new Date(dateString);
		// Use formatForDatetimeLocal to get the local time string (YYYY-MM-DDTHH:mm)
		// instead of toISOString() which returns UTC time
		return formatForDatetimeLocal(date);
	};

	// Transform event data for the form
	const locationValue = event.isExternalEvent
		? event.address || ""
		: event.isOnline && event.onlineUrl
			? event.onlineUrl
			: event.address || "";

	const organizationIdValue = event.organizationId ?? "none";

	const formDefaultValues = {
		title: event.title,
		richContent: event.richContent || "",
		shortDescription: event.shortDescription || "",
		contentImages: event.contentImages || [], // Use actual data if available, otherwise empty array
		type: event.type as any,
		startTime: formatDateForInput(event.startTime),
		endTime: formatDateForInput(event.endTime),
		// Convert old fields to new simplified location field
		location: locationValue,
		organizationId: organizationIdValue,
		isExternalEvent: event.isExternalEvent,
		externalUrl: event.externalUrl || "",
		maxAttendees: event.maxAttendees?.toString() || "",
		registrationDeadline: event.registrationDeadline
			? formatDateForInput(event.registrationDeadline)
			: "",
		requireApproval: event.requireApproval,
		requireProjectSubmission: event.requireProjectSubmission || false, // 作品关联设置
		askDigitalCardConsent: event.askDigitalCardConsent || false, // 数字名片公开确认
		registrationSuccessInfo: event.registrationSuccessInfo || "",
		registrationSuccessImage: event.registrationSuccessImage || "",
		registrationPendingInfo: event.registrationPendingInfo || "",
		registrationPendingImage: event.registrationPendingImage || "",
		coverImage: event.coverImage || "", // Pass the actual cover image URL
		tags: event.tags,
		questions: event.questions.map((q, index) => ({
			id: q.id,
			question: q.question,
			description: q.description || "",
			type: q.type,
			required: q.required,
			options: q.options || [],
			order: q.order ?? index,
		})),
		ticketTypes: (event.ticketTypes || []).map((t) => ({
			name: t.name,
			description: t.description || "",
			price: t.price || 0,
			quantity: t.maxQuantity || 100,
		})),
		volunteerRoles: (event.volunteerRoles || []).map((vr) => ({
			volunteerRoleId: vr.volunteerRole.id,
			recruitCount: vr.recruitCount,
			description: vr.description || "",
			requireApproval: vr.requireApproval ?? true,
		})),
		volunteerContactInfo: event.volunteerContactInfo || "",
		volunteerWechatQrCode: event.volunteerWechatQrCode || "",
		organizerContact: event.organizerContact || "",
		// Building Public 字段
		minCheckIns: event.buildingConfig?.requiredCheckIns || 7,
		depositAmount: event.buildingConfig?.depositAmount || 0,
		refundRate: event.buildingConfig?.refundRate || 1.0,
		paymentType: (event.buildingConfig?.paymentType === "CUSTOM"
			? "CUSTOM"
			: "NONE") as "NONE" | "CUSTOM",
		paymentUrl: event.buildingConfig?.paymentUrl || "",
		paymentQRCode: event.buildingConfig?.paymentQRCode || "",
		paymentNote: event.buildingConfig?.paymentNote || "",
		// Hackathon 字段
		hackathonConfig: event.hackathonConfig || {
			settings: {
				maxTeamSize: 5,
				allowSolo: true,
				requireProject: false,
			},
			voting: {
				allowPublicVoting: true,
				enableJudgeVoting: true,
				judgeWeight: 0.7,
				publicWeight: 0.3,
				publicVotingScope: "PARTICIPANTS" as const,
			},
		},
	};

	return (
		<div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="flex justify-between items-start mb-8">
					<div>
						<div className="flex items-center gap-2 mb-2">
							<Button variant="ghost" size="sm" asChild>
								<Link href={`/app/events/${eventId}/manage`}>
									{t("backToManagement")}
								</Link>
							</Button>
						</div>
						<h1 className="text-3xl font-bold tracking-tight">
							{t("editEvent")}
						</h1>
						<p className="text-muted-foreground mt-2">
							{t("updateDescription")}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							variant={
								event.status === "PUBLISHED"
									? "default"
									: "secondary"
							}
						>
							{event.status}
						</Badge>
						<Button variant="outline" asChild>
							<Link href={`/events/${event.id}`}>
								{t("viewPublicPage")}
							</Link>
						</Button>
					</div>
				</div>

				{/* Event Status Banner */}
				{event.status !== "PUBLISHED" && (
					<Card className="mb-6 border-yellow-200 bg-yellow-50">
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<span className="font-medium text-yellow-800">
									{t("eventNotVisible", {
										status: event.status.toLowerCase(),
									})}
								</span>
								{event.status === "DRAFT" && (
									<Button size="sm" className="ml-auto">
										{t("publishEvent")}
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Edit Form */}
				<EventCreateForm
					organizations={organizations}
					volunteerRoles={volunteerRoles}
					onSubmit={handleSubmit}
					onSaveAsTemplate={handleSaveAsTemplate}
					isLoading={isSubmitting}
					defaultValues={formDefaultValues}
					isEdit={true}
					user={user || undefined}
					onRefreshOrganizations={refetchUserOrganizations}
				/>

				{/* Delete Event Section */}
				<Card className="mt-8 border-red-200">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-medium text-red-600">
									删除活动
								</h3>
								<p className="text-sm text-muted-foreground mt-1">
									此操作无法撤销。活动和所有相关数据将被永久删除。
								</p>
							</div>
							<Dialog>
								<DialogTrigger asChild>
									<Button variant="destructive" size="sm">
										<TrashIcon className="w-4 h-4 mr-2" />
										删除活动
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>确认删除活动</DialogTitle>
										<DialogDescription>
											您确定要删除活动 "{event.title}"
											吗？此操作无法撤销，所有注册信息和活动数据都将被永久删除。
										</DialogDescription>
									</DialogHeader>
									<DialogFooter>
										<Button variant="outline">取消</Button>
										<Button
											variant="destructive"
											onClick={handleDelete}
											disabled={isDeleting}
										>
											{isDeleting
												? "删除中..."
												: "确认删除"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
