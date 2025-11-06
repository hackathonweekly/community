import { ToolsGrid } from "@/modules/tools/components/ToolsGrid";
import { ToolsHeader } from "@/modules/tools/components/ToolsHeader";

export async function generateMetadata() {
	return {
		title: "周周黑客松常用工具链接",
		description: "周周黑客松社区常用链接和文档入口，快速直达常用工具。",
	};
}

export default async function ToolsPage() {
	return (
		<div className="container pt-28 pb-12">
			<ToolsHeader />
			<ToolsGrid />
		</div>
	);
}
