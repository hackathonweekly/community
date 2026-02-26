"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@community/ui/ui/button";
import { useSession } from "@/modules/account/auth/hooks/use-session";
import { useEventRegistrationStatus } from "./useEventRegistrationStatus";

interface SubmissionsActionButtonProps {
	eventId: string;
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
	isSubmissionOpen = false,
	className,
	size = "default",
	variant,
}: SubmissionsActionButtonProps) {
	const { user } = useSession();
	const router = useRouter();

	const manageHref = `/events/${eventId}/submissions`;
	const computedVariant = variant ?? "default";

	const { data: registration, isLoading: isRegistrationLoading } =
		useEventRegistrationStatus(eventId, user?.id);

	const label = isSubmissionOpen ? "提交/编辑作品" : "管理我的作品";

	const { status: registrationStatus } = registration ?? {};
	const isRegistrationApproved = registrationStatus === "APPROVED";

	const handleRequireAuth = () => {
		const redirectTo = encodeURIComponent(manageHref);
		router.push(`/auth/login?redirectTo=${redirectTo}`);
	};

	const handleUnregisteredClick = () => {
		toast.error("需要报名才能提交作品");
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

	if (isRegistrationLoading) {
		return (
			<Button
				size={size}
				variant={computedVariant}
				className={className}
				disabled
			>
				<Target className="h-4 w-4 mr-1.5" />
				{label}
			</Button>
		);
	}

	if (!isRegistrationApproved) {
		return (
			<Button
				size={size}
				variant={computedVariant}
				className={className}
				onClick={handleUnregisteredClick}
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
