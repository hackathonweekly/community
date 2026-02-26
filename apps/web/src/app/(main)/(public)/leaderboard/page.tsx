import { LeaderboardPage } from "@/modules/public/leaderboard/LeaderboardPage";

export const metadata = {
	title: "社区排行榜",
	description: "展示社区贡献者排名",
};

export default function Page() {
	return <LeaderboardPage />;
}
