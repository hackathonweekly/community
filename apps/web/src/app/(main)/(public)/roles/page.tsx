import { FunctionalRolesDirectory } from "@/modules/public/functional-roles/components/FunctionalRolesDirectory";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "职能角色对接",
	description: "浏览所有社区组织的在任职能角色，快速找到对应负责人",
};

export default async function RolesPage() {
	return (
		<div className="container max-w-6xl px-4 pt-16 sm:pt-24 lg:pt-28 pb-20">
			<FunctionalRolesDirectory />
		</div>
	);
}
