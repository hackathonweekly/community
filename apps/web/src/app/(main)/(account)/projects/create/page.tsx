"use client";

import { Button } from "@community/ui/ui/button";
import { useSession } from "@shared/auth/hooks/use-session";
import { ArrowLeft } from "lucide-react";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectCreateForm } from "./ProjectCreateForm";

export default function CreateProjectPage() {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const returnTo = searchParams.get("returnTo");
	const [isLoading, setIsLoading] = useState(false);
	const { user } = useSession(); // 获取当前用户信息

	const handleSubmit = async (data: any) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/projects", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				let errorMessage = t(
					"projects.create.notifications.createFailed",
				);
				try {
					const error = await response.json();
					if (error?.error) {
						errorMessage = error.error;
					}
				} catch (parseError) {
					console.error(
						"Failed to parse project creation error response:",
						parseError,
					);
				}
				console.error(
					"Server error response:",
					response.status,
					response.statusText,
				);
				throw new Error(errorMessage);
			}

			await response.json();
			toast.success(t("projects.create.notifications.success"));

			// If returnTo parameter exists, redirect there, otherwise go to projects page
			if (returnTo) {
				router.push(returnTo);
			} else {
				router.push("/projects");
			}
		} catch (error) {
			console.error("Error creating project:", error);

			const fallbackError = t(
				"projects.create.notifications.createFailed",
			);
			const errorMessage =
				error instanceof Error && error.message
					? error.message
					: fallbackError;

			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<MobilePageHeader title={t("projects.create.title")} />
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					{/* Breadcrumb and Back Button */}
					<div className="mb-6">
						<Button
							variant="ghost"
							onClick={() => router.back()}
							className="mb-4 hidden lg:inline-flex"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							返回
						</Button>

						<nav className="flex text-sm text-muted-foreground mb-4">
							<Link
								href="/projects"
								className="hover:text-foreground transition-colors"
							>
								{t("projects.create.breadcrumb.projects")}
							</Link>
							<span className="mx-2">/</span>
							<span className="text-foreground">
								{t("projects.create.breadcrumb.createNew")}
							</span>
						</nav>
					</div>

					<div className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight">
							{t("projects.create.title")}
						</h1>
						<p className="text-muted-foreground mt-2">
							{t("projects.create.subtitle")}
						</p>
					</div>

					{/* Encouraging content */}
					{/* <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
					<div className="mb-3">
						<h2 className="text-lg font-semibold text-gray-900 mb-1">
							{t("projects.create.encouragement.title")}
						</h2>
					</div>
					<div className="grid grid-cols-2 gap-3 mb-3">
						<div className="flex items-center space-x-2">
							<div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
								<Eye className="h-3 w-3 text-blue-600" />
							</div>
							<p className="text-xs font-medium text-gray-700">
								{t(
									"projects.create.encouragement.benefits.exposure",
								)}
							</p>
						</div>
						<div className="flex items-center space-x-2">
							<div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
								<MessageCircle className="h-3 w-3 text-green-600" />
							</div>
							<p className="text-xs font-medium text-gray-700">
								{t(
									"projects.create.encouragement.benefits.feedback",
								)}
							</p>
						</div>
						<div className="flex items-center space-x-2">
							<div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
								<Users className="h-3 w-3 text-purple-600" />
							</div>
							<p className="text-xs font-medium text-gray-700">
								{t(
									"projects.create.encouragement.benefits.collaboration",
								)}
							</p>
						</div>
						<div className="flex items-center space-x-2">
							<div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
								<Briefcase className="h-3 w-3 text-orange-600" />
							</div>
							<p className="text-xs font-medium text-gray-700">
								{t(
									"projects.create.encouragement.benefits.opportunities",
								)}
							</p>
						</div>
					</div>
					<p className="text-blue-700 text-sm font-medium">
						{t("projects.create.encouragement.callToAction")}
					</p>
				</div> */}

					<ProjectCreateForm
						onSubmit={handleSubmit}
						isLoading={isLoading}
						currentUserId={user?.id}
					/>
				</div>
			</div>
		</>
	);
}
