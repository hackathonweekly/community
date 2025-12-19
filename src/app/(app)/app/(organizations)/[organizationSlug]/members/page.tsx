"use client";

import {
	MemberList,
	type MemberData,
	type SortOption,
} from "@/components/shared/MemberList";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";

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

interface Organization {
	id: string;
	name: string;
	slug: string;
}

export default function OrganizationMembersPage() {
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;

	const [organization, setOrganization] = useState<Organization | null>(null);
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
				setOrganization(data.organization);
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
			showWechat: member.user?.showWechat || false,
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

	if (!organization && !loading) {
		return (
			<div className="container max-w-6xl mx-auto p-6">
				<p>组织未找到</p>
			</div>
		);
	}

	return (
		<div className="container max-w-6xl mx-auto p-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">
					{organization?.name} - 组织成员
				</h1>
			</div>

			<MemberList
				members={sortedMembers}
				loading={loading}
				viewMode="grid"
				showViewModeToggle={true}
				defaultViewMode="grid"
				showAvatar={true}
				showLevel={true}
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
				searchPlaceholder="搜索成员姓名、自我介绍或技能..."
				sortOptions={sortOptions}
				onSearch={setSearchTerm}
				onSort={setSortBy}
			/>
		</div>
	);
}
