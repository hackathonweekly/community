"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@community/ui/ui/table";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import {
	Calendar,
	Users,
	MapPin,
	Clock,
	Plus,
	Edit,
	Eye,
	ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface OrganizationEvent {
	id: string;
	shortId?: string;
	title: string;
	richContent: string;
	shortDescription?: string;
	startTime: string;
	endTime: string;
	status: "DRAFT" | "PUBLISHED" | "CANCELLED";
	address?: string;
	maxAttendees?: number;
	createdAt: string;
	// Add computed fields
	registrationCount?: number;
}

export function OrganizationEventsAdmin() {
	const [events, setEvents] = useState<OrganizationEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("all");

	useEffect(() => {
		fetchEvents();
	}, []);

	const fetchEvents = async () => {
		try {
			const orgSlug = window.location.pathname.split("/")[2];

			// First, get the organization ID from the slug
			const orgResponse = await fetch(
				`/api/organizations/by-slug/${orgSlug}`,
			);
			if (!orgResponse.ok) {
				throw new Error("Failed to fetch organization");
			}
			const orgData = await orgResponse.json();

			// Then, get events for this organization - don't specify status to get all events
			const response = await fetch(
				`/api/events?organizationId=${orgData.id}&limit=100`,
			);
			if (response.ok) {
				const data = await response.json();
				const eventsData =
					data.data?.events || data.data || data.events || data || [];

				// Add registration count from the events data
				const eventsWithRegistrationCount = eventsData.map(
					(event: any) => ({
						...event,
						registrationCount:
							event._count?.registrations ||
							event.registrationCount ||
							0,
					}),
				);

				setEvents(eventsWithRegistrationCount);
			}
		} catch (error) {
			console.error("Failed to fetch events:", error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			DRAFT: { variant: "secondary" as const, text: "草稿" },
			PUBLISHED: { variant: "default" as const, text: "已发布" },
			CANCELLED: { variant: "destructive" as const, text: "已取消" },
		};
		return (
			statusConfig[status as keyof typeof statusConfig] || {
				variant: "secondary" as const,
				text: status,
			}
		);
	};

	const getFilteredEvents = () => {
		switch (activeTab) {
			case "draft":
				return events.filter((event) => event.status === "DRAFT");
			case "published":
				return events.filter((event) => event.status === "PUBLISHED");
			case "cancelled":
				return events.filter((event) => event.status === "CANCELLED");
			default:
				return events;
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-64" />
					<div className="h-96 bg-muted rounded" />
				</div>
			</div>
		);
	}

	const filteredEvents = getFilteredEvents();

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">活动管理</h1>
					<p className="text-muted-foreground mt-2">
						查看组织活动报名情况
					</p>
					<p className="text-sm text-blue-600 mt-1">
						<Link
							href="/events?tab=manage"
							className="flex items-center hover:underline"
						>
							前往活动管理中心进行详细的活动管理
							<ExternalLink className="w-4 h-4 ml-1" />
						</Link>
					</p>
				</div>
				<Link href="/events/create">
					<Button>
						<Plus className="w-4 h-4 mr-2" />
						创建活动
					</Button>
				</Link>
			</div>

			{/* 活动统计概览 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总活动数
						</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{events.length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							已发布
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{
								events.filter((e) => e.status === "PUBLISHED")
									.length
							}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总报名数
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{events.reduce(
								(sum, event) =>
									sum + (event.registrationCount || 0),
								0,
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							活动容量
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{events.reduce(
								(sum, event) => sum + (event.maxAttendees || 0),
								0,
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 活动列表 */}
			<Card>
				<CardHeader>
					<CardTitle>活动列表</CardTitle>
					<CardDescription>管理您的组织活动</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="space-y-4"
					>
						<TabsList>
							<TabsTrigger value="all">
								全部 ({events.length})
							</TabsTrigger>
							<TabsTrigger value="draft">
								草稿 (
								{
									events.filter((e) => e.status === "DRAFT")
										.length
								}
								)
							</TabsTrigger>
							<TabsTrigger value="published">
								已发布 (
								{
									events.filter(
										(e) => e.status === "PUBLISHED",
									).length
								}
								)
							</TabsTrigger>
							<TabsTrigger value="cancelled">
								已取消 (
								{
									events.filter(
										(e) => e.status === "CANCELLED",
									).length
								}
								)
							</TabsTrigger>
						</TabsList>

						<TabsContent value={activeTab}>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>活动名称</TableHead>
										<TableHead>开始时间</TableHead>
										<TableHead>地点</TableHead>
										<TableHead>状态</TableHead>
										<TableHead>报名情况</TableHead>
										<TableHead>操作</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredEvents.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-8 text-muted-foreground"
											>
												{events.length === 0
													? "该组织还没有创建任何活动"
													: "没有符合筛选条件的活动"}
												<div className="mt-2">
													<Link
														href="/events/create"
														className="text-blue-600 hover:underline"
													>
														创建第一个活动
													</Link>
												</div>
											</TableCell>
										</TableRow>
									) : (
										filteredEvents.map((event) => {
											const statusConfig = getStatusBadge(
												event.status,
											);
											return (
												<TableRow key={event.id}>
													<TableCell>
														<div>
															<div className="font-medium">
																{event.title}
															</div>
															<div className="text-sm text-muted-foreground truncate max-w-xs">
																{event.richContent ||
																	event.shortDescription}
															</div>
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center">
															<Calendar className="w-4 h-4 mr-1" />
															{new Date(
																event.startTime,
															).toLocaleDateString()}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center">
															<MapPin className="w-4 h-4 mr-1" />
															{event.address ||
																"线上活动"}
														</div>
													</TableCell>
													<TableCell>
														<Badge
															variant={
																statusConfig.variant
															}
														>
															{statusConfig.text}
														</Badge>
													</TableCell>
													<TableCell>
														<div className="text-sm">
															<span className="font-medium">
																{event.registrationCount ||
																	0}
															</span>
															<span className="text-muted-foreground">
																/{" "}
																{event.maxAttendees ||
																	"无限制"}
															</span>
															{event.maxAttendees && (
																<div className="text-xs text-muted-foreground">
																	{Math.round(
																		((event.registrationCount ||
																			0) /
																			event.maxAttendees) *
																			100,
																	)}
																	% 已报名
																</div>
															)}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center space-x-2">
															<Link
																href={`/events/${event.shortId || event.id}`}
															>
																<Button
																	size="sm"
																	variant="outline"
																>
																	<Eye className="w-4 h-4" />
																</Button>
															</Link>
															<Link
																href={`/events/${event.shortId || event.id}/manage`}
															>
																<Button
																	size="sm"
																	variant="outline"
																>
																	<Edit className="w-4 h-4" />
																</Button>
															</Link>
														</div>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
