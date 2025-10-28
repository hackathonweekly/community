"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserSlideDeckModal } from "@/modules/public/shared/components/UserSlideDeck";
import {
	createProfileSlideDeckUser,
	type ProfileUser,
} from "@/modules/public/shared/components/UserSlideDeckUtils";
import { Presentation } from "lucide-react";

interface ProfileSlideModeLauncherProps {
	user: ProfileUser;
}

export function ProfileSlideModeLauncher({
	user,
}: ProfileSlideModeLauncherProps) {
	const [open, setOpen] = useState(false);
	const slides = useMemo(() => [createProfileSlideDeckUser(user)], [user]);

	return (
		<>
			<Button
				variant="outline"
				onClick={() => setOpen(true)}
				className="h-9 rounded-full border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
			>
				<Presentation className="mr-2 h-4 w-4" />
				PPT 模式
			</Button>
			<UserSlideDeckModal
				open={open}
				onOpenChange={setOpen}
				users={slides}
				headerLabel="个人名片 · Slide 模式"
				closingNote="已完成本次个人介绍"
				closingSubNote="感谢观看，如果你对我感兴趣，欢迎现场交流或扫码联系"
			/>
		</>
	);
}
