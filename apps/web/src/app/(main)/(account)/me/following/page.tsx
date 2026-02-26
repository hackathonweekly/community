"use client";

import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { UserCardList } from "@community/ui/shared/UserCardList";
import { useTranslations } from "next-intl";

export default function FollowingPage() {
	const t = useTranslations("bookmarks");

	return (
		<>
			<MobilePageHeader title={t("userFollowing")} />
			<UserCardList
				title={t("userFollowing")}
				description="你关注的用户，按最新关注时间排序"
				apiEndpoint="/api/user/following"
				searchPlaceholder="搜索你关注的用户的姓名、自我介绍或技能..."
				emptyStateMessage="你还没有关注任何用户，去发现一些有趣的创作者吧！"
				showCommonEvents={true}
			/>
		</>
	);
}
