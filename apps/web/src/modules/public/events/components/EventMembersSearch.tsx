"use client";

import {
	MemberList,
	type MemberData,
	type SortOption,
} from "@community/ui/shared/MemberList";
import { useState, useMemo } from "react";

interface EventMembersSearchProps {
	registrations: Array<{
		id: string;
		status: string;
		registeredAt: string;
		user: {
			id: string;
			name: string;
			image?: string;
			username?: string;
			userRoleString?: string;
			currentWorkOn?: string;
			bio?: string;
			email?: string;
			skills?: string[];
			region?: string | null;
			lifeStatus?: string | null;
			whatICanOffer?: string | null;
			whatIAmLookingFor?: string | null;
			// 联系方式
			showEmail?: boolean;
			showWechat?: boolean;
			githubUrl?: string | null;
			twitterUrl?: string | null;
			websiteUrl?: string | null;
			wechatId?: string | null;
			// 身份字段
			membershipLevel?: string | null;
		};
	}>;
	loading?: boolean;
}

export function EventMembersSearch({
	registrations,
	loading = false,
}: EventMembersSearchProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("joinDate");

	// 转换报名数据为 MemberData 格式
	const transformedMembers: MemberData[] = useMemo(() => {
		return registrations
			.filter(
				(reg) =>
					reg.status === "APPROVED" || reg.status === "CHECKED_IN",
			)
			.map((reg) => ({
				id: reg.id,
				name: reg.user.name || null,
				email: reg.user.email || "",
				username: reg.user.username || null,
				image: reg.user.image || null,
				bio: reg.user.bio || null,
				region: reg.user.region || null,
				role: undefined,
				createdAt: reg.registeredAt,
				joinedAt: reg.registeredAt,
				skills: reg.user.skills || [],
				userRoleString: reg.user.userRoleString || null,
				showEmail: reg.user.showEmail || false,
				showWechat: reg.user.showWechat || false,
				githubUrl: reg.user.githubUrl || null,
				twitterUrl: reg.user.twitterUrl || null,
				websiteUrl: reg.user.websiteUrl || null,
				wechatId: reg.user.wechatId || null,
				membershipLevel: reg.user.membershipLevel || null,
			}));
	}, [registrations]);

	// 搜索过滤
	const filteredMembers = useMemo(() => {
		if (!searchTerm) return transformedMembers;

		const searchText = searchTerm.toLowerCase();
		return transformedMembers.filter((member) => {
			const name = member.name || "";
			const bio = member.bio || "";
			const userRole = member.userRoleString || "";
			const skills = (member.skills || []).join(" ");

			return (
				name.toLowerCase().includes(searchText) ||
				bio.toLowerCase().includes(searchText) ||
				userRole.toLowerCase().includes(searchText) ||
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
		{ value: "joinDate", label: "报名时间" },
		{ value: "name", label: "姓名" },
		{ value: "skillCount", label: "技能数量" },
	];

	return (
		<div className="mt-4">
			<MemberList
				members={sortedMembers}
				loading={loading}
				viewMode="grid"
				showViewModeToggle={true}
				defaultViewMode="grid"
				showAvatar={true}
				showLevel={true}
				showSkills={true}
				showRole={false}
				showBio={true}
				showRegion={true}
				showContactLinks={true}
				showJoinDate={false}
				enableSearch={true}
				enableSort={true}
				enableFilters={false}
				searchPlaceholder="搜索成员姓名、自我介绍、技能或标签..."
				sortOptions={sortOptions}
				onSearch={setSearchTerm}
				onSort={setSortBy}
			/>
		</div>
	);
}
