"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	MemberList,
	type MemberData,
	type SortOption,
} from "@/components/shared/MemberList";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Settings,
	Calendar,
	FolderOpen,
	ExternalLink,
	Globe,
	UserPlus,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { InviteMemberForm } from "@dashboard/organizations/components/InviteMemberForm";

interface Member {
	id: string;
	role: string;
	createdAt: string;
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
		bio: string | null;
		region: string | null;
		userRoleString: string | null;
		githubUrl: string | null;
		twitterUrl: string | null;
		websiteUrl: string | null;
		wechatId: string | null;
		email: string;
		showEmail: boolean;
		showWechat: boolean;
		profilePublic: boolean;
		skills: string[];
	};
	inviter?: {
		id: string;
		name: string | null;
		username: string | null;
	} | null;
}

export function OrganizationPageClient({
	activeOrganization,
	userIsAdmin,
	eventsCount,
	membersCount,
}: {
	activeOrganization: any;
	userIsAdmin: boolean;
	eventsCount: number;
	membersCount: number;
}) {
	const params = useParams();
	const locale = useLocale();
	const organizationSlug = params.organizationSlug as string;
	const [members, setMembers] = useState<Member[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("joinDate");

	useEffect(() => {
		fetchOrganizationMembers();
	}, [organizationSlug]);

	const fetchOrganizationMembers = async () => {
		try {
			const response = await fetch(
				`/api/organizations/${organizationSlug}/members`,
			);
			if (response.ok) {
				const data = await response.json();
				setMembers(data.members || []);
			}
		} catch (error) {
			console.error("Failed to fetch organization members:", error);
		} finally {
			setLoading(false);
		}
	};

	// 转换成员数据为 MemberData 格式
	const transformedMembers: MemberData[] = useMemo(() => {
		return members.map((member) => ({
			id: member.id,
			name: member.user?.name || null,
			email: member.user?.email || "",
			username: member.user?.username || null,
			image: member.user?.image || null,
			bio: member.user?.bio || null,
			region: member.user?.region || null,
			role: member.role,
			createdAt: member.createdAt,
			joinedAt: member.createdAt,
			skills: member.user?.skills || [],
			userRoleString: member.user?.userRoleString || null,
			showEmail: member.user?.showEmail || false,
			githubUrl: member.user?.githubUrl || null,
			twitterUrl: member.user?.twitterUrl || null,
			websiteUrl: member.user?.websiteUrl || null,
			wechatId: member.user?.wechatId || null,
			inviter: member.inviter
				? {
						id: member.inviter.id,
						name: member.inviter.name || null,
						username: member.inviter.username || null,
					}
				: null,
		}));
	}, [members]);

	// 搜索过滤
	const filteredMembers = useMemo(() => {
		if (!searchTerm) return transformedMembers;

		const searchText = searchTerm.toLowerCase();
		return transformedMembers.filter((member) => {
			const name = member.name || "";
			const bio = member.bio || "";
			const skills = (member.skills || []).join(" ");

			return (
				name.toLowerCase().includes(searchText) ||
				bio.toLowerCase().includes(searchText) ||
				skills.toLowerCase().includes(searchText)
			);
		});
	}, [transformedMembers, searchTerm]);

	// 排序
	const sortedMembers = useMemo(() => {
		const sorted = [...filteredMembers];

		switch (sortBy) {
			case "name":
				return sorted.sort((a, b) =>
					(a.name || "").localeCompare(b.name || ""),
				);
			case "joinDate":
				return sorted.sort(
					(a, b) =>
						new Date(b.joinedAt || b.createdAt).getTime() -
						new Date(a.joinedAt || a.createdAt).getTime(),
				);
			case "skillCount":
				return sorted.sort(
					(a, b) => (b.skills?.length || 0) - (a.skills?.length || 0),
				);
			default:
				return sorted;
		}
	}, [filteredMembers, sortBy]);

	// 排序选项
	const sortOptions: SortOption[] = [
		{ value: "joinDate", label: "加入时间" },
		{ value: "name", label: "姓名" },
		{ value: "skillCount", label: "技能数量" },
	];

	return (
		<div className="container max-w-4xl mx-auto px-3 py-4">
			{/* 页面标题 */}
			<div className="mb-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold tracking-tight">
							{activeOrganization.name}
						</h1>
						<p className="text-sm text-muted-foreground">
							组织概览
						</p>
					</div>
					{/* 管理功能按钮移到右上角 */}
					{userIsAdmin && (
						<div className="flex items-center gap-2">
							<Dialog>
								<DialogTrigger asChild>
									<Button size="sm" className="gap-1">
										<UserPlus className="h-3 w-3" />
										<span className="hidden sm:inline">
											邀请成员
										</span>
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-md">
									<DialogHeader>
										<DialogTitle>邀请成员</DialogTitle>
										<DialogDescription>
											邀请新成员加入组织
										</DialogDescription>
									</DialogHeader>
									<div className="py-4">
										<InviteMemberForm
											organizationId={
												activeOrganization.id
											}
											organizationSlug={
												activeOrganization.slug
											}
											onMemberAdded={
												fetchOrganizationMembers
											}
										/>
									</div>
								</DialogContent>
							</Dialog>
							<Link
								href={`/app/${activeOrganization.slug}/settings/general`}
							>
								<Button
									size="sm"
									variant="outline"
									className="gap-1"
								>
									<Settings className="h-3 w-3" />
									<span className="hidden sm:inline">
										设置
									</span>
								</Button>
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* 快速导航 */}
			<Card className="mb-4">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">快速导航</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
						<Link href={`/zh/orgs/${activeOrganization.slug}`}>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start h-8 text-xs"
							>
								<ExternalLink className="h-3 w-3 mr-1" />
								社区首页
							</Button>
						</Link>
						<Link
							href={`/${locale}/events?organization=${activeOrganization.slug}`}
						>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start h-8 text-xs"
							>
								<Calendar className="h-3 w-3 mr-1" />
								公开活动
							</Button>
						</Link>
						<Link
							href={`/zh/projects?organization=${activeOrganization.slug}`}
						>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start h-8 text-xs"
							>
								<FolderOpen className="h-3 w-3 mr-1" />
								公开作品
							</Button>
						</Link>
						<Link href="/zh/orgs?explore=true">
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start h-8 text-xs"
							>
								<Globe className="h-3 w-3 mr-1" />
								探索组织
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>

			{/* 组织成员 */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">组织成员</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<MemberList
						members={sortedMembers}
						loading={loading}
						viewMode="compact"
						showViewModeToggle={false}
						showAvatar={true}
						showLevel={false}
						showSkills={true}
						showRole={true}
						showInviter={true}
						showBio={true}
						showRegion={true}
						showContactLinks={true}
						showJoinDate={false}
						enableSearch={true}
						enableSort={true}
						enableFilters={false}
						searchPlaceholder="搜索成员姓名、简介或技能..."
						sortOptions={sortOptions}
						onSearch={setSearchTerm}
						onSort={setSortBy}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
