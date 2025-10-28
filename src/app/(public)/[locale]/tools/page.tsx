import { ToolsGrid } from "@/modules/tools/components/ToolsGrid";
import { ToolsHeader } from "@/modules/tools/components/ToolsHeader";

export async function generateMetadata() {
	return {
		title: "周周黑客松社区常用工具与链接",
		description: "周周黑客松社区常用工具、文档与链接",
	};
}

export default async function ToolsPage() {
	return (
		<div className="container pt-32 pb-16">
			<ToolsHeader />
			<ToolsGrid />
		</div>
	);
}
