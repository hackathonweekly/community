"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

type EventRegistration = {
	status?: string | null;
} | null;

export function SubmissionsActionButton({
	eventId,
	locale,
	isSubmissionOpen = false,
	className,
	size = "default",
	variant,
}: SubmissionsActionButtonProps) {
	const { user } = useSession();
	const router = useRouter();

	const manageHref = `/app/events/${eventId}/submissions`;
	const registerHref = `/${locale}/events/${eventId}/register`;
	const computedVariant = variant ?? "default";

	const { data: registration } = useQuery<EventRegistration>({
		queryKey: ["event-registration-status", eventId, user?.id],
		enabled: Boolean(user?.id),
		staleTime: 60 * 1000,
		queryFn: async () => {
			const response = await fetch(
				`/api/events/${eventId}/registration`,
				{
					credentials: "include",
				},
			);

			if (!response.ok) {
				return null;
			}

			const result = await response.json();
			return (result?.data as EventRegistration) ?? null;
		},
	});

	const isRegistrationApproved = registration?.status === "APPROVED";
	const actionHref = isRegistrationApproved ? manageHref : registerHref;

	const label = isRegistrationApproved
		? isSubmissionOpen
			? "提交/编辑作品"
			: "管理我的作品"
		: "立即报名";

	const handleRequireAuth = () => {
		// Take users directly to the authenticated submissions dashboard after login.
		const redirectTo = encodeURIComponent(actionHref);
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
			<Link href={actionHref}>
				<Target className="h-4 w-4 mr-1.5" />
				{label}
			</Link>
		</Button>
	);
}
