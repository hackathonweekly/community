"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserOrganizations } from "@/modules/account/organizations/hooks/use-user-organizations";
import {
	EventSeriesForm,
	type EventSeriesSubmitPayload,
} from "@/modules/account/events/series/components/EventSeriesForm";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { Card, CardContent } from "@community/ui/ui/card";

export default function CreateEventSeriesPage() {
	const router = useRouter();
	const { organizations, isLoading } = useUserOrganizations();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const organizationOptions = useMemo(
		() =>
			organizations.map((organization) => ({
				id: organization.id,
				name: organization.name,
			})),
		[organizations],
	);

	const handleCreate = async (payload: EventSeriesSubmitPayload) => {
		setIsSubmitting(true);
		try {
			const response = await fetch("/api/event-series", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error?.error || "创建系列失败");
			}

			toast.success("系列活动创建成功");
			router.push("/events/series/manage");
		} catch (error) {
			console.error("Error creating event series:", error);
			toast.error(
				error instanceof Error ? error.message : "创建系列失败",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<MobilePageHeader
				title="创建系列"
				onBack={() => router.push("/events/series/manage")}
			/>
			<div className="mx-auto max-w-7xl px-4 py-5 lg:px-8 lg:py-6">
				<div className="mb-6 flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-brand text-2xl font-bold tracking-tight md:text-3xl">
							创建系列活动
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							设置系列标题、介绍与归属，后续可绑定多个活动场次。
						</p>
					</div>
					<Link
						href="/events/series/manage"
						className="text-sm text-muted-foreground underline-offset-4 hover:underline"
					>
						返回系列管理
					</Link>
				</div>
				{isLoading ? (
					<Card className="max-w-5xl rounded-lg border border-border shadow-subtle">
						<CardContent className="py-10 text-center text-sm text-muted-foreground">
							正在加载组织信息...
						</CardContent>
					</Card>
				) : (
					<div className="max-w-5xl">
						<EventSeriesForm
							mode="create"
							organizations={organizationOptions}
							isSubmitting={isSubmitting}
							onSubmit={handleCreate}
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
