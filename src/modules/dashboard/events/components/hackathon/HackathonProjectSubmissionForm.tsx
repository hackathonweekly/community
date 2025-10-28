"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Code, Presentation } from "lucide-react";
import { TeamMemberSelector } from "./TeamMemberSelector";
import { toast } from "sonner";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";

interface HackathonProjectSubmissionFormProps {
	eventId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	maxTeamSize?: number;
}

const submissionSchema = z.object({
	projectId: z.string().min(1, "Please select a project"),
	title: z.string().min(1, "Project title is required").max(255),
	description: z.string().min(1, "Project description is required"),
	demoUrl: z
		.string()
		.url("Please enter a valid URL")
		.optional()
		.or(z.literal("")),
	sourceCode: z
		.string()
		.url("Please enter a valid URL")
		.optional()
		.or(z.literal("")),
	presentationUrl: z
		.string()
		.url("Please enter a valid URL")
		.optional()
		.or(z.literal("")),
	teamMemberIds: z.array(z.string()).optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export function HackathonProjectSubmissionForm({
	eventId,
	open,
	onOpenChange,
	maxTeamSize = 5,
}: HackathonProjectSubmissionFormProps) {
	const t = useTranslations();
	const { user } = useSession();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userProjects, setUserProjects] = useState<any[]>([]);
	const [isLoadingProjects, setIsLoadingProjects] = useState(false);
	const [selectedProject, setSelectedProject] = useState<any>(null);
	const [teamMembers, setTeamMembers] = useState<string[]>([]);

	const form = useForm<SubmissionFormData>({
		resolver: zodResolver(submissionSchema),
		defaultValues: {
			projectId: "",
			title: "",
			description: "",
			demoUrl: "",
			sourceCode: "",
			presentationUrl: "",
			teamMemberIds: [],
		},
	});

	// Load user projects when dialog opens
	const loadUserProjects = async () => {
		if (!user?.id || isLoadingProjects) return;

		setIsLoadingProjects(true);
		try {
			const response = await fetch(`/api/projects?userId=${user.id}`);
			if (response.ok) {
				const data = await response.json();
				setUserProjects(data.data || []);
			}
		} catch (error) {
			console.error("Error loading projects:", error);
			toast.error(t("hackathon.submission.errors.loadProjects"));
		} finally {
			setIsLoadingProjects(false);
		}
	};

	// Load projects when dialog opens
	useEffect(() => {
		if (open) {
			loadUserProjects();
		}
	}, [open]);

	// Handle project selection
	const handleProjectSelect = (projectId: string) => {
		const project = userProjects.find((p) => p.id === projectId);
		if (project) {
			setSelectedProject(project);
			form.setValue("projectId", projectId);
			form.setValue("title", project.title);
			form.setValue("description", project.description || "");
			form.setValue("demoUrl", project.url || "");
			form.setValue("sourceCode", project.githubUrl || "");
		}
	};

	// Handle form submission
	const onSubmit = async (data: SubmissionFormData) => {
		if (!user?.id) {
			toast.error(t("auth.errors.notAuthenticated"));
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = {
				...data,
				submissionType: "HACKATHON_PROJECT",
				teamMemberIds: teamMembers,
				demoUrl: data.demoUrl || undefined,
				sourceCode: data.sourceCode || undefined,
				presentationUrl: data.presentationUrl || undefined,
			};

			const response = await fetch(
				`/api/events/${eventId}/submit-project`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				},
			);

			const result = await response.json();

			if (response.ok) {
				toast.success(t("hackathon.submission.success"));
				onOpenChange(false);
				// Reset form
				form.reset();
				setTeamMembers([]);
				setSelectedProject(null);
			} else {
				toast.error(
					result.error || t("hackathon.submission.errors.submit"),
				);
			}
		} catch (error) {
			console.error("Error submitting project:", error);
			toast.error(t("hackathon.submission.errors.submit"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCreateNewProject = () => {
		// Navigate to project creation page
		window.open("/projects/new", "_blank");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center">
						<Code className="w-5 h-5 mr-2" />
						{t("hackathon.submission.title")}
					</DialogTitle>
					<DialogDescription>
						{t("hackathon.submission.description")}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6"
					>
						{/* Project Selection */}
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="projectId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t(
												"hackathon.submission.selectProject",
											)}
										</FormLabel>
										<Select
											onValueChange={handleProjectSelect}
											value={field.value}
											disabled={isLoadingProjects}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={
															isLoadingProjects
																? t(
																		"common.loading",
																	)
																: t(
																		"hackathon.submission.selectProjectPlaceholder",
																	)
														}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{userProjects.map((project) => (
													<SelectItem
														key={project.id}
														value={project.id}
													>
														<div className="flex items-center justify-between w-full">
															<span>
																{project.title}
															</span>
															<Badge
																variant="outline"
																className="ml-2"
															>
																{project.stage}
															</Badge>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											{t(
												"hackathon.submission.projectHelp",
											)}{" "}
											<Button
												type="button"
												variant="link"
												className="p-0 h-auto"
												onClick={handleCreateNewProject}
											>
												{t(
													"hackathon.submission.createNew",
												)}
											</Button>
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Project Preview */}
						{selectedProject && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										{t(
											"hackathon.submission.projectPreview",
										)}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex items-start space-x-4">
										{selectedProject.screenshots?.[0] && (
											<img
												src={
													selectedProject
														.screenshots[0]
												}
												alt={selectedProject.title}
												className="w-16 h-16 rounded object-cover"
											/>
										)}
										<div className="flex-1">
											<h4 className="font-medium">
												{selectedProject.title}
											</h4>
											<p className="text-sm text-muted-foreground mt-1">
												{selectedProject.description}
											</p>
											{selectedProject.projectTags
												?.length > 0 && (
												<div className="flex flex-wrap gap-1 mt-2">
													{selectedProject.projectTags
														.slice(0, 3)
														.map((tag: string) => (
															<Badge
																key={tag}
																variant="secondary"
																className="text-xs"
															>
																{tag}
															</Badge>
														))}
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Submission Details */}
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t(
												"hackathon.submission.submissionTitle",
											)}
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"hackathon.submission.titlePlaceholder",
												)}
												{...field}
											/>
										</FormControl>
										<FormDescription>
											{t(
												"hackathon.submission.titleHelp",
											)}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t(
											"hackathon.submission.submissionDescription",
										)}
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t(
												"hackathon.submission.descriptionPlaceholder",
											)}
											className="min-h-[100px]"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										{t(
											"hackathon.submission.descriptionHelp",
										)}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Links */}
						<div className="space-y-4">
							<h4 className="font-medium">
								{t("hackathon.submission.linksTitle")}
							</h4>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="demoUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center">
												<ExternalLink className="w-4 h-4 mr-1" />
												{t(
													"hackathon.submission.demoUrl",
												)}
											</FormLabel>
											<FormControl>
												<Input
													placeholder="https://example.com/demo"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="sourceCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center">
												<Code className="w-4 h-4 mr-1" />
												{t(
													"hackathon.submission.sourceCode",
												)}
											</FormLabel>
											<FormControl>
												<Input
													placeholder="https://github.com/user/repo"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="presentationUrl"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel className="flex items-center">
												<Presentation className="w-4 h-4 mr-1" />
												{t(
													"hackathon.submission.presentationUrl",
												)}
											</FormLabel>
											<FormControl>
												<Input
													placeholder="https://docs.google.com/presentation/..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Team Members */}
						<div className="space-y-4">
							<h4 className="font-medium">
								{t("hackathon.submission.teamMembers")}
							</h4>
							<TeamMemberSelector
								selectedMembers={teamMembers}
								onMembersChange={setTeamMembers}
								maxMembers={maxTeamSize - 1} // Subtract 1 for the project owner
								projectId={selectedProject?.id}
							/>
						</div>

						{/* Submit Button */}
						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								{t("common.cancel")}
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{t("hackathon.submission.submit")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
