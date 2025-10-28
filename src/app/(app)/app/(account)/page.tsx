import { getSession } from "@dashboard/auth/lib/server";
import UserStart from "@dashboard/start/UserStart";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "仪表盘",
};

export default async function AppStartPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	return (
		<div className="">
			<UserStart />
		</div>
	);
}
