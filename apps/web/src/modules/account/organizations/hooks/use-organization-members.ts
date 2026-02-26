"use client";

import type {
	FilterOption,
	MemberData,
	SortOption,
} from "@community/ui/shared/MemberList";
import { useEffect, useMemo, useState } from "react";

export interface OrganizationMember {
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

export interface OrganizationInfo {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	summary?: string | null;
}

export const SORT_OPTIONS: SortOption[] = [
	{ value: "joinDate", label: "加入时间" },
	{ value: "name", label: "姓名" },
	{ value: "skillCount", label: "技能数量" },
];

export const ROLE_FILTER_OPTIONS: FilterOption[] = [
	{ value: "all", label: "全部角色" },
	{ value: "owner", label: "组织者" },
	{ value: "admin", label: "管理员" },
	{ value: "core", label: "核心成员" },
	{ value: "member", label: "成员" },
];

function transformMembers(members: OrganizationMember[]): MemberData[] {
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
}

function filterMembers(
	members: MemberData[],
	searchTerm: string,
	roleFilter: string,
): MemberData[] {
	let result = members;

	if (roleFilter && roleFilter !== "all") {
		result = result.filter((member) => member.role === roleFilter);
	}

	if (searchTerm) {
		const searchText = searchTerm.toLowerCase();
		result = result.filter((member) => {
			const name = member.name || "";
			const bio = member.bio || "";
			const skills = (member.skills || []).join(" ");
			return (
				name.toLowerCase().includes(searchText) ||
				bio.toLowerCase().includes(searchText) ||
				skills.toLowerCase().includes(searchText)
			);
		});
	}

	return result;
}

function sortMembers(members: MemberData[], sortBy: string): MemberData[] {
	const sorted = [...members];
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
}

export function useOrganizationMembers(slug: string) {
	const [members, setMembers] = useState<OrganizationMember[]>([]);
	const [organization, setOrganization] = useState<OrganizationInfo | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("joinDate");
	const [roleFilter, setRoleFilter] = useState("all");

	const fetchMembers = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/organizations/${slug}/members`);
			if (response.ok) {
				const data = await response.json();
				setOrganization(data.organization ?? null);
				setMembers(data.members || []);
				setError(false);
			} else {
				setError(true);
			}
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMembers();
	}, [slug]);

	const transformedMembers = useMemo(
		() => transformMembers(members),
		[members],
	);

	const filteredMembers = useMemo(
		() => filterMembers(transformedMembers, searchTerm, roleFilter),
		[transformedMembers, searchTerm, roleFilter],
	);

	const sortedMembers = useMemo(
		() => sortMembers(filteredMembers, sortBy),
		[filteredMembers, sortBy],
	);

	const handleFilter = (filters: Record<string, string>) => {
		if (filters.role) {
			setRoleFilter(filters.role);
		}
	};

	return {
		organization,
		members,
		transformedMembers,
		filteredMembers,
		sortedMembers,
		loading,
		error,
		searchTerm,
		sortBy,
		roleFilter,
		setSearchTerm,
		setSortBy,
		setRoleFilter,
		handleFilter,
		refetch: fetchMembers,
	};
}
