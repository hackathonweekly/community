"use client";

import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { FriendsTabSelector } from "@community/ui/ui/friends-tab-selector";
import {
	useMutualFriendsQuery,
	useInteractiveUsersQuery,
} from "@community/lib-client/api/api-hooks";

export default function InteractiveUsersPage() {
	const { data: mutualFriendsData, isLoading: mutualLoading } =
		useMutualFriendsQuery(1);
	const { data: interactiveData, isLoading: interactiveLoading } =
		useInteractiveUsersQuery(1);

	if (mutualLoading || interactiveLoading) {
		return (
			<>
				<MobilePageHeader title="我的朋友" />
				<div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-0">
					<div className="mb-4 sm:mb-6 md:mb-8">
						<h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
							我的朋友
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base">
							管理你的社交网络，发现更多合作机会
						</p>
					</div>
					<div className="animate-pulse">
						<div className="h-10 bg-gray-200 rounded mb-6" />
						<div className="space-y-4">
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className="h-32 bg-gray-200 rounded"
								/>
							))}
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<MobilePageHeader title="我的朋友" />
			<FriendsTabSelector
				mutualFriendsCount={mutualFriendsData?.totalCount || 0}
				interactiveUsersCount={interactiveData?.totalCount || 0}
			/>
		</>
	);
}
