"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@shared/auth/hooks/use-session";
import { EventCreateForm } from "@/modules/account/events/components/EventCreateForm";
import { toast } from "sonner";
import { Button } from "@community/ui/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type TemplateType = "HACKATHON_LEARNING" | "MEETUP" | "CUSTOM" | "HACKATHON";

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
}

interface VolunteerRole {
	id: string;
	name: string;
	description: string;
	detailDescription?: string;
	iconUrl?: string;
	cpPoints: number;
}

interface Template {
	id: string;
	name: string;
	description: string;
	type: TemplateType;
	title: string;
	defaultDescription: string;
	shortDescription?: string | null;
	duration?: number;
	maxAttendees?: number;
	requireApproval: boolean;
	isSystemTemplate: boolean;
	isFeatured: boolean;
	isPublic: boolean;
	isActive: boolean;
	createdBy?: string;
	organizationId?: string;
	ticketTypes: Array<{
		id: string;
		name: string;
		description?: string;
		price?: number;
		maxQuantity?: number;
		sortOrder: number;
	}>;
	volunteerRoles: Array<{
		id: string;
		volunteerRoleId: string;
		recruitCount: number;
		description?: string;
		requireApproval: boolean;
		volunteerRole: {
			id: string;
			name: string;
			description: string;
		};
	}>;
	questions: Array<{
		id: string;
		question: string;
		type: string;
		options: string[];
		required: boolean;
		order: number;
	}>;
}

// 模板编辑时复用活动表单，需要给定位置信息以通过活动验证规则
const DEFAULT_TEMPLATE_LOCATION = "线上活动（待定）";

const mapTemplateTypeToEventType = (
	templateType: TemplateType,
): "MEETUP" | "HACKATHON" => {
	switch (templateType) {
		case "HACKATHON_LEARNING":
			return "HACKATHON";
		case "MEETUP":
			return "MEETUP";
		default:
			return "MEETUP";
	}
};

type TemplateEditPageParams =
	| Promise<{ templateId: string }>
	| { templateId: string };

export default function TemplateEditPage(props: {
	params: Promise<TemplateEditPageParams>;
}) {
	const params = use(props.params);
	const router = useRouter();
	const { user } = useSession();
	const paramsPromise = useMemo(() => {
		if (
			typeof params === "object" &&
			params !== null &&
			typeof (params as Promise<unknown>).then === "function"
		) {
			return params as Promise<{ templateId: string }>;
		}

		return Promise.resolve(params as { templateId: string });
	}, [params]);
	const resolvedParams = use(paramsPromise);
	const { templateId } = resolvedParams;
	const [template, setTemplate] = useState<Template | null>(null);
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [volunteerRoles, setVolunteerRoles] = useState<VolunteerRole[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchTemplate = async () => {
		try {
			const response = await fetch(`/api/event-templates/${templateId}`);
			if (response.ok) {
				const data = await response.json();
				const templateData = data.data;

				// 检查权限
				if (
					templateData.createdBy !== user?.id &&
					user?.role !== "super_admin"
				) {
					router.push("/events/create");
					toast.error("您没有权限编辑此模板");
					return;
				}

				setTemplate(templateData);
			} else {
				toast.error("模板不存在");
				router.push("/events/create");
			}
		} catch (error) {
			console.error("Error fetching template:", error);
			toast.error("获取模板失败");
			router.push("/events/create");
		}
	};

	const fetchUserOrganizations = async () => {
		try {
			const response = await fetch("/api/user/organizations");
			if (response.ok) {
				const data = await response.json();
				setOrganizations(data.data?.organizations || []);
			}
		} catch (error) {
			console.error("Error fetching organizations:", error);
		}
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

	useEffect(() => {
		if (user) {
			Promise.all([
				fetchTemplate(),
				fetchUserOrganizations(),
				fetchVolunteerRoles(),
			]).finally(() => {
				setLoading(false);
			});
		}
	}, [user, templateId]);

	const handleSubmit = async (data: any) => {
		if (!template) {
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch(
				`/api/event-templates/${template.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: `${data.title} - 模板`,
						description: `基于活动"${data.title}"创建的模板`,
						title: data.title,
						defaultDescription: data.richContent,
						shortDescription: (() => {
							const shortDesc =
								data.shortDescription?.trim() ?? "";
							return shortDesc.length > 0 ? shortDesc : null;
						})(),
						duration:
							data.endTime && data.startTime
								? Math.round(
										(new Date(data.endTime).getTime() -
											new Date(
												data.startTime,
											).getTime()) /
											(1000 * 60),
									)
								: undefined,
						maxAttendees: data.maxAttendees
							? Number.parseInt(data.maxAttendees)
							: undefined,
						requireApproval: data.requireApproval,
						organizationId: data.organizationId,
						ticketTypes:
							data.ticketTypes?.map((tt: any, index: number) => ({
								name: tt.name,
								description: tt.description,
								price: tt.price,
								maxQuantity: tt.quantity,
								sortOrder: index,
							})) || [],
						volunteerRoles: data.volunteerRoles || [],
						questions:
							data.questions?.map((q: any, index: number) => ({
								question: q.question,
								type: q.type,
								options: q.options || [],
								required: q.required,
								order: index,
							})) || [],
					}),
				},
			);

			if (response.ok) {
				toast.success("模板更新成功！");
				router.push("/events/create");
			} else {
				const error = await response.json();
				toast.error(error.message || "更新模板失败");
			}
		} catch (error) {
			console.error("Error updating template:", error);
			toast.error("更新模板时发生错误");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!user) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-2xl font-bold">请先登录</h1>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight">
							编辑模板
						</h1>
						<p className="text-muted-foreground mt-2">
							正在加载模板信息...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (!template) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-2xl font-bold">模板不存在</h1>
				</div>
			</div>
		);
	}

	// 转换模板数据为表单数据格式
	const formData = {
		title: template.title,
		richContent: template.defaultDescription,
		shortDescription: template.shortDescription || "",
		type: mapTemplateTypeToEventType(template.type),
		location: DEFAULT_TEMPLATE_LOCATION,
		isExternalEvent: false,
		organizationId: template.organizationId ?? "none",
		requireApproval: template.requireApproval,
		maxAttendees: template.maxAttendees?.toString(),
		ticketTypes: template.ticketTypes.map((tt) => ({
			name: tt.name,
			description: tt.description ?? "",
			price: typeof tt.price === "number" ? tt.price : 0,
			quantity: typeof tt.maxQuantity === "number" ? tt.maxQuantity : 1,
		})),
		volunteerRoles: template.volunteerRoles.map((vr) => ({
			volunteerRoleId: vr.volunteerRoleId,
			recruitCount: vr.recruitCount ?? 1,
			description: vr.description ?? "",
			requireApproval: vr.requireApproval ?? true,
		})),
		questions: template.questions.map((q) => ({
			question: q.question,
			type: q.type,
			options: Array.isArray(q.options) ? q.options : [],
			required: q.required ?? false,
		})),
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<div className="mb-8">
					<div className="flex items-center gap-2 mb-2">
						<Button variant="ghost" size="sm" asChild>
							<Link href="/events/create">
								<ArrowLeftIcon className="w-4 h-4 mr-1" />
								返回活动创建
							</Link>
						</Button>
					</div>
					<h1 className="text-3xl font-bold tracking-tight">
						编辑模板: {template.name}
					</h1>
					<p className="text-muted-foreground mt-2">
						编辑模板的完整配置信息，包括基本设置、报名设置、志愿者角色等
					</p>
				</div>

				<EventCreateForm
					onSubmit={handleSubmit}
					isLoading={isSubmitting}
					organizations={organizations}
					volunteerRoles={volunteerRoles}
					initialData={formData}
					isEditMode={true}
					hideTemplateAction={true}
				/>
			</div>
		</div>
	);
}
