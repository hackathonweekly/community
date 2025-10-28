import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "客服配置管理",
	description: "管理客服与反馈功能的配置",
};

export default function CustomerServiceAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
