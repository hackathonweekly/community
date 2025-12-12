"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";

interface SubmissionsActionButtonProps {
	eventId: string;
	locale: string;
	isSubmissionOpen?: boolean;
	className?: string;
	size?: "default" | "sm" | "lg" | "icon";
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
}

export function SubmissionsActionButton({
	eventId,
	locale: _locale,
	isSubmissionOpen = false,
	className,
	size = "default",
	variant,
}: SubmissionsActionButtonProps) {
	const { user } = useSession();
	const router = useRouter();

	const manageHref = `/app/events/${eventId}/submissions`;
	const computedVariant = variant ?? "default";
	const label = isSubmissionOpen ? "提交/编辑作品" : "管理我的作品";

	const handleRequireAuth = () => {
		// Take users directly to the authenticated submissions dashboard after login.
		const redirectTo = encodeURIComponent(manageHref);
		router.push(`/auth/login?redirectTo=${redirectTo}`);
	};

	if (!user) {
		return (
			<Button
				size={size}
				variant={computedVariant}
				className={className}
				onClick={handleRequireAuth}
			>
				<Target className="h-4 w-4 mr-1.5" />
				{label}
			</Button>
		);
	}

	return (
		<Button
			size={size}
			variant={computedVariant}
			className={className}
			asChild
		>
			<Link href={manageHref}>
				<Target className="h-4 w-4 mr-1.5" />
				{label}
			</Link>
		</Button>
	);
}
