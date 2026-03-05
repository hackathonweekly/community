"use client";

import type { ProfileUser } from "@/modules/public/shared/components/UserSlideDeckUtils";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { UserProfile } from "../types";
import { ProfileIdentity } from "./ProfileIdentity";
import { ProfileCollaboration } from "./ProfileCollaboration";
import { ProfileContactCard } from "./ProfileContactCard";
import { ProfileActions } from "./ProfileActions";
import { ProfileQRDialog } from "./ProfileQRDialog";

interface ProfileHeaderProps {
	user: UserProfile;
	currentUserId?: string;
	translations: {
		editProfile: string;
		collaborationInfo: string;
		whatICanOffer: string;
		whatIAmLookingFor: string;
	};
	profileUser: ProfileUser;
}

export function ProfileHeader({
	user,
	currentUserId,
	translations,
	profileUser,
}: ProfileHeaderProps) {
	const searchParams = useSearchParams();
	const [showQR, setShowQR] = useState(false);

	const returnTo = useMemo(() => {
		const raw = searchParams.get("returnTo");
		if (!raw) return null;
		const trimmed = raw.trim();
		if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
		for (let i = 0; i < trimmed.length; i += 1) {
			const code = trimmed.charCodeAt(i);
			if (code < 32 || code === 127) return null;
		}
		return trimmed;
	}, [searchParams]);

	const backLabel = returnTo?.includes("/events/") ? "返回活动" : "返回";

	return (
		<>
			{/* Floating nav buttons - mobile only */}
			<div className="fixed top-4 left-4 z-50 flex items-center gap-2 lg:hidden">
				{returnTo && (
					<a
						href={returnTo}
						className="flex items-center justify-center w-12 h-12 rounded-full bg-card border border-border hover:bg-muted transition-colors shadow-md"
						aria-label={backLabel}
						title={backLabel}
					>
						<ArrowLeft className="h-5 w-5" />
						<span className="sr-only">{backLabel}</span>
					</a>
				)}
				<a
					href="/"
					className="flex items-center justify-center w-12 h-12 rounded-full bg-card border border-border hover:bg-muted transition-colors shadow-md"
					aria-label="返回首页"
					title="返回首页"
				>
					<img
						src="/images/logo-stack.png"
						alt="Logo"
						className="w-10 h-10"
					/>
				</a>
			</div>

			{/* Desktop back button */}
			{returnTo && (
				<a
					href={returnTo}
					className="hidden lg:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
				>
					<ArrowLeft className="h-4 w-4" />
					{backLabel}
				</a>
			)}

			<div className="mb-8">
				<div className="space-y-6">
					<ProfileIdentity
						user={user}
						currentUserId={currentUserId}
						translations={{ editProfile: translations.editProfile }}
					/>

					<ProfileContactCard
						user={user}
						currentUserId={currentUserId}
					/>

					<ProfileCollaboration
						user={user}
						translations={{
							collaborationInfo: translations.collaborationInfo,
							whatICanOffer: translations.whatICanOffer,
							whatIAmLookingFor: translations.whatIAmLookingFor,
						}}
					/>

					<ProfileActions
						user={user}
						currentUserId={currentUserId}
						profileUser={profileUser}
						onShowQR={() => setShowQR(true)}
					/>

					<ProfileQRDialog
						username={user.username || ""}
						open={showQR}
						onClose={() => setShowQR(false)}
					/>
				</div>
			</div>
		</>
	);
}
