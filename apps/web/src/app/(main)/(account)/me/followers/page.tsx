"use client";

import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { UserCardList } from "@community/ui/shared/UserCardList";
import { useTranslations } from "next-intl";

export default function FollowersPage() {
	const t = useTranslations("bookmarks");

	return (
		<>
			<MobilePageHeader title="关注我的人" />
			<UserCardList
				title="关注我的人"
				description="关注了你的用户，按最新关注时间排序"
				apiEndpoint="/api/user/followers"
				searchPlaceholder="搜索关注了你的用户的姓名、自我介绍或技能..."
				emptyStateMessage="还没有人关注你，完善你的个人资料来吸引更多关注吧！"
				showCommonEvents={true}
			/>
		</>
	);
}
