"use client";

import { Button } from "@community/ui/ui/button";
import { Skeleton } from "@community/ui/ui/skeleton";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { ProjectEditForm } from "./ProjectEditForm";

export default function ProjectEditPage() {
	const router = useRouter();
	const params = useParams();
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [project, setProject] = useState(null);
	const [isLoadingProject, setIsLoadingProject] = useState(true);

	const projectId = params.projectId as string;

	// Load project data
	useEffect(() => {
		const fetchProject = async () => {
			try {
				const response = await fetch(`/api/projects/${projectId}`);
				if (!response.ok) {
					throw new Error("Failed to fetch project");
				}
				const data = await response.json();
				setProject(data.project);
			} catch (error) {
				console.error("Error fetching project:", error);
				toast({
					title: "Error",
					description: "Failed to load project. Please try again.",
					variant: "destructive",
				});
				router.push("/projects");
			} finally {
				setIsLoadingProject(false);
			}
		};

		fetchProject();
	}, [projectId]);

	const handleSubmit = async (data: any) => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/projects/${projectId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error("Failed to update project");
			}

			toast({
				title: "Success",
				description: "作品更新成功！",
			});

			router.push("/projects");
		} catch (error) {
			console.error("Error updating project:", error);
			toast({
				title: "Error",
				description: "Failed to update project. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoadingProject) {
		return (
			<>
				<MobilePageHeader title="编辑作品" />
				<div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5 lg:py-6 pb-20 lg:pb-6">
					<div className="space-y-4">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-64" />
						<Skeleton className="h-64 w-full" />
					</div>
				</div>
			</>
		);
	}

	if (!project) {
		return (
			<>
				<MobilePageHeader title="编辑作品" />
				<div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5 lg:py-6 pb-20 lg:pb-6">
					<div className="text-center py-16 text-muted-foreground">
						项目不存在
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<MobilePageHeader title="编辑作品" />
			<div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5 lg:py-6 pb-20 lg:pb-6">
				{/* Header */}
				<div className="flex items-center gap-4 mb-6 sm:mb-8">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.back()}
						className="hidden sm:flex items-center gap-2"
					>
						<ArrowLeftIcon className="h-4 w-4" />
						返回
					</Button>
					<div>
						<h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
							编辑作品
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base mt-1">
							更新你的作品信息
						</p>
					</div>
				</div>

				{/* Edit Form */}
				<ProjectEditForm
					project={project}
					onSubmit={handleSubmit}
					isLoading={isLoading}
				/>
			</div>
		</>
	);
}
