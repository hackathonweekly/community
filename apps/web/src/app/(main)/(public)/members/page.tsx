"use client";

import { useSession } from "@shared/auth/hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UserOrganization {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
	_count: { members: number };
	memberRole: string;
}

export default function MembersPage() {
	const t = useTranslations();
	const { user } = useSession();
	const router = useRouter();

	const { data, isLoading } = useQuery({
		queryKey: ["user-organizations-for-members"],
		queryFn: async () => {
			const response = await fetch("/api/user/organizations");
			if (!response.ok) throw new Error("Failed to fetch");
			return response.json();
		},
		enabled: !!user,
		staleTime: 1000 * 60 * 5,
	});

	const organizations: UserOrganization[] = data?.data?.organizations ?? [];

	useEffect(() => {
		if (!isLoading && organizations.length > 0) {
			const savedSlug = localStorage.getItem("preferred-org-slug");
			const targetOrg = savedSlug
				? organizations.find((o) => o.slug === savedSlug) ||
					organizations[0]
				: organizations[0];
			router.replace(`/orgs/${targetOrg.slug}/members`);
		}
	}, [isLoading, organizations, router]);

	if (!user) {
		return (
			<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<Users className="h-12 w-12 text-gray-300 dark:text-[#262626] mb-4" />
					<h2 className="font-brand text-xl font-bold text-foreground mb-2">
						{t("tab_nav.members")}
					</h2>
					<p className="text-sm text-muted-foreground mb-6 max-w-md">
						登录后查看你所在组织的成员列表
					</p>
					<Link
						href="/auth/login?redirectTo=/members"
						className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
					>
						{t("common.menu.login")}
					</Link>
				</div>
			</div>
		);
	}

	if (isLoading || organizations.length > 0) {
		return (
			<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
				<div className="flex items-center justify-center py-20">
					<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
				</div>
			</div>
		);
	}

	// All users with organizations are redirected above, so only "no org" state remains
	return (
		<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<Users className="h-12 w-12 text-gray-300 dark:text-[#262626] mb-4" />
				<h2 className="font-brand text-xl font-bold text-foreground mb-2">
					还未加入任何组织
				</h2>
				<p className="text-sm text-muted-foreground mb-6 max-w-md">
					加入一个组织后即可查看成员列表
				</p>
				<Link
					href="/orgs"
					className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
				>
					浏览组织
				</Link>
			</div>
		</div>
	);
}
