"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { UserCardList } from "@/components/shared/UserCardList";

interface FriendsTabSelectorProps {
	mutualFriendsCount: number;
	interactiveUsersCount: number;
}

function FriendsTabSelectorInner({
	mutualFriendsCount,
	interactiveUsersCount,
}: FriendsTabSelectorProps) {
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState("mutual");

	useEffect(() => {
		const tab = searchParams.get("tab");
		if (tab && ["mutual", "interactive"].includes(tab)) {
			setActiveTab(tab);
		}
	}, [searchParams]);

	return (
		<div className="max-w-6xl mx-auto">
			<div className="mb-6 sm:mb-8">
				<h1 className="text-2xl sm:text-3xl font-bold mb-2">
					我的朋友
				</h1>
				<p className="text-muted-foreground text-sm sm:text-base">
					管理你的社交网络，发现更多合作机会
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="mutual">
						互关好友 ({mutualFriendsCount})
					</TabsTrigger>
					<TabsTrigger value="interactive">
						互动过的 ({interactiveUsersCount})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="mutual" className="mt-6">
					<UserCardList
						title=""
						description="你们互相收藏，关系更进一步的朋友"
						apiEndpoint="/api/user/mutual-friends"
						searchPlaceholder="搜索互关好友的姓名、自我介绍或技能..."
						emptyStateMessage="你还没有互关好友，快去收藏其他用户吧！"
						showCommonEvents={false}
					/>
				</TabsContent>

				<TabsContent value="interactive" className="mt-6">
					<UserCardList
						title=""
						description="曾经与你参加过相同活动的用户，按最新加入时间排序"
						apiEndpoint="/api/user/interactive-users"
						searchPlaceholder="搜索朋友的姓名、自我介绍或技能..."
						emptyStateMessage="你还没有互动过的朋友，快去参加活动结识新朋友吧！"
						showCommonEvents={true}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export function FriendsTabSelector(props: FriendsTabSelectorProps) {
	return (
		<Suspense
			fallback={
				<div className="max-w-6xl mx-auto">
					<div className="mb-6 sm:mb-8">
						<h1 className="text-2xl sm:text-3xl font-bold mb-2">
							我的朋友
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base">
							管理你的社交网络，发现更多合作机会
						</p>
					</div>
					<Tabs defaultValue="mutual" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="mutual">
								互关好友 ({props.mutualFriendsCount})
							</TabsTrigger>
							<TabsTrigger value="interactive">
								互动过的 ({props.interactiveUsersCount})
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			}
		>
			<FriendsTabSelectorInner {...props} />
		</Suspense>
	);
}
