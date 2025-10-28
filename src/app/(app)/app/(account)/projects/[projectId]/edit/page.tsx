"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ProjectEditForm } from "./ProjectEditForm";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
				router.push("/app/projects");
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

			router.push("/app/projects");
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
			<div className="container mx-auto py-8">
				<div className="max-w-4xl mx-auto">
					<div className="text-center">Loading...</div>
				</div>
			</div>
		);
	}

	if (!project) {
		return (
			<div className="container mx-auto py-8">
				<div className="max-w-4xl mx-auto">
					<div className="text-center">Project not found</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="max-w-4xl mx-auto">
				{/* Breadcrumb */}
				<Breadcrumb className="mb-6">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/app">
								Dashboard
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/app/projects">
								Projects
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>编辑作品</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{/* Header */}
				<div className="flex items-center gap-4 mb-8">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.back()}
						className="flex items-center gap-2"
					>
						<ArrowLeftIcon className="h-4 w-4" />
						返回
					</Button>
					<div>
						<h1 className="text-3xl font-bold">编辑作品</h1>
						<p className="text-muted-foreground mt-1">
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
		</div>
	);
}
