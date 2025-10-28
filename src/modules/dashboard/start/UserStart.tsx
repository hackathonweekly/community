"use client";
import { useSession } from "@dashboard/auth/hooks/use-session";
import CreatorDashboard from "@dashboard/dashboard/components/CreatorDashboard";
import { useTranslations } from "next-intl";

export default function UserStart() {
	const t = useTranslations();
	const { user } = useSession();

	return (
		<div>
			{/* 新的创造者面板 */}
			<CreatorDashboard />
		</div>
	);
}
