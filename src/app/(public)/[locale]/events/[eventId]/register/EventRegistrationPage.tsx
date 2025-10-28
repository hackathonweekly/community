"use client";

import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { EventRegistrationForm } from "@/modules/public/events/components/EventRegistrationForm";
// import { eventKeys } from "../hooks/useEventQueries";

interface EventRegistrationPageProps {
	event: any; // Using any to avoid type conflicts for now
}

export function EventRegistrationPage({ event }: EventRegistrationPageProps) {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const { user } = useSession();
	const queryClient = useQueryClient();
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Redirect to event page if user is not logged in
	useEffect(() => {
		if (!user) {
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(pathname)}`,
			);
		}
	}, [user, router, pathname]);

	// Check if event allows registration
	const canRegister = () => {
		if (event.isExternalEvent) return false;
		if (event.status === "COMPLETED") return false;
		if (event.status === "DRAFT") return false;
		if (new Date(event.endTime) < new Date()) return false;
		if (
			event.registrationDeadline &&
			new Date(event.registrationDeadline) < new Date()
		) {
			return false;
		}
		return true;
	};

	const handleRegistrationComplete = (registration: any) => {
		toast.success(
			registration.status === "PENDING"
				? "报名申请已提交，请等待审核"
				: "报名成功！",
		);

		// Refresh event data would go here
		// queryClient.invalidateQueries({
		// 	queryKey: eventKeys.detail(event.id),
		// });

		// Redirect back to event page
		router.push(`/${pathname.split("/")[1]}/events/${event.id}`);
	};

	const handleGoBack = () => {
		router.back();
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600 mb-4">正在跳转到登录页面...</p>
				</div>
			</div>
		);
	}

	if (!canRegister()) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container max-w-2xl mx-auto pt-8 pb-24 px-4">
					{/* Header */}
					<div className="flex items-center gap-4 mb-8">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleGoBack}
							className="h-10 w-10"
						>
							<ArrowLeftIcon className="h-5 w-5" />
						</Button>
						<h1 className="text-xl font-semibold">活动报名</h1>
					</div>

					{/* Event not available for registration */}
					<Card>
						<CardContent className="pt-6">
							<div className="text-center py-8">
								<p className="text-gray-600 mb-4">
									{event.status === "COMPLETED" ||
									new Date(event.endTime) < new Date()
										? "该活动已结束，无法报名"
										: event.status === "DRAFT"
											? "该活动尚未开始报名"
											: "报名已截止"}
								</p>
								<Button asChild>
									<Link
										href={`/${pathname.split("/")[1]}/events/${event.id}`}
									>
										返回活动详情
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container max-w-2xl mx-auto pt-8 pb-24 px-4">
				{/* Header */}
				<div className="flex items-center gap-4 mb-8 sticky top-0 bg-gray-50 py-4 z-10">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleGoBack}
						className="h-10 w-10"
					>
						<ArrowLeftIcon className="h-5 w-5" />
					</Button>
					<div className="flex-1">
						<h1 className="text-xl font-semibold">活动报名</h1>
						<p className="text-sm text-gray-600">{event.title}</p>
					</div>
				</div>

				{/* Event Info Summary */}
				<Card className="mb-6">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">{event.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 text-sm">
							<div className="flex items-center gap-2">
								<span className="text-gray-500">时间:</span>
								<span>
									{new Date(
										event.startTime,
									).toLocaleDateString("zh-CN", {
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
							{event.address && (
								<div className="flex items-center gap-2">
									<span className="text-gray-500">地点:</span>
									<span>{event.address}</span>
								</div>
							)}
							{event.requireApproval && (
								<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
									<p className="text-sm text-yellow-800">
										⚠️
										该活动需要审核，提交报名后请等待组织者确认
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Registration Form */}
				<EventRegistrationForm
					event={event}
					isSubmitting={isSubmitting}
					onSubmittingChange={setIsSubmitting}
					onRegistrationComplete={handleRegistrationComplete}
					onCancel={handleGoBack}
				/>
			</div>
		</div>
	);
}
