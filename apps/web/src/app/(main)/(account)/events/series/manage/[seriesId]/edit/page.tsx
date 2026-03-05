"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserOrganizations } from "@/modules/account/organizations/hooks/use-user-organizations";
import {
	EventSeriesForm,
	type EventSeriesSubmitPayload,
	type EventSeriesFormValues,
} from "@/modules/account/events/series/components/EventSeriesForm";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { Card, CardContent } from "@community/ui/ui/card";

interface EventSeriesDetail {
	id: string;
	slug: string;
	title: string;
	description?: string | null;
	richContent?: string | null;
	coverImage?: string | null;
	logoImage?: string | null;
	tags?: string[];
	organizationId?: string | null;
	isActive: boolean;
}

export default function EditEventSeriesPage() {
	const router = useRouter();
	const params = useParams();
	const seriesId = params.seriesId as string;
	const { organizations, isLoading: organizationsLoading } =
		useUserOrganizations();

	const [series, setSeries] = useState<EventSeriesDetail | null>(null);
	const [loadingSeries, setLoadingSeries] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const organizationOptions = useMemo(
		() =>
			organizations.map((organization) => ({
				id: organization.id,
				name: organization.name,
			})),
		[organizations],
	);

	useEffect(() => {
		const fetchSeriesDetail = async () => {
			setLoadingSeries(true);
			try {
				const response = await fetch(`/api/event-series/${seriesId}`);
				if (!response.ok) {
					const error = await response.json();
					throw new Error(error?.error || "获取系列详情失败");
				}
				const result = await response.json();
				setSeries(result?.data ?? null);
			} catch (error) {
				console.error("Error fetching event series detail:", error);
				toast.error(
					error instanceof Error ? error.message : "获取系列详情失败",
				);
				router.push("/events/series/manage");
			} finally {
				setLoadingSeries(false);
			}
		};

		if (seriesId) {
			fetchSeriesDetail();
		}
	}, [router, seriesId]);

	const handleUpdate = async (payload: EventSeriesSubmitPayload) => {
		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/event-series/${seriesId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error?.error || "更新系列失败");
			}

			toast.success("系列活动已更新");
			router.push("/events/series/manage");
		} catch (error) {
			console.error("Error updating event series:", error);
			toast.error(
				error instanceof Error ? error.message : "更新系列失败",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const initialValues = useMemo<Partial<EventSeriesFormValues> | undefined>(
		() =>
			series
				? {
						title: series.title,
						slug: series.slug,
						description: series.description || "",
						richContent: series.richContent || "",
						coverImage: series.coverImage || "",
						logoImage: series.logoImage || "",
						tags: (series.tags ?? []).join(", "),
						organizationId: series.organizationId || "none",
						isActive: series.isActive,
					}
				: undefined,
		[series],
	);

	return (
		<>
			<MobilePageHeader
				title="编辑系列"
				onBack={() => router.push("/events/series/manage")}
			/>
			<div className="mx-auto max-w-7xl px-4 py-5 lg:px-8 lg:py-6">
				<div className="mb-6 flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-brand text-2xl font-bold tracking-tight md:text-3xl">
							编辑系列活动
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							更新系列介绍、封面与展示状态，变更会同步到系列页面。
						</p>
					</div>
					<Link
						href="/events/series/manage"
						className="text-sm text-muted-foreground underline-offset-4 hover:underline"
					>
						返回系列管理
					</Link>
				</div>
				{loadingSeries || organizationsLoading || !initialValues ? (
					<Card className="max-w-5xl rounded-lg border border-border shadow-subtle">
						<CardContent className="py-10 text-center text-sm text-muted-foreground">
							正在加载系列信息...
						</CardContent>
					</Card>
				) : (
					<div className="max-w-5xl">
						<EventSeriesForm
							mode="edit"
							organizations={organizationOptions}
							initialValues={initialValues}
							isSubmitting={isSubmitting}
							onSubmit={handleUpdate}
							onCancel={() =>
								router.push("/events/series/manage")
							}
						/>
					</div>
				)}
			</div>
		</>
	);
}
