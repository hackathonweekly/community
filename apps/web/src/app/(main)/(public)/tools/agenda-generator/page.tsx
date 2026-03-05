import { AgendaGenerator } from "@/modules/tools/agenda/components/AgendaGenerator";

export async function generateMetadata() {
	return {
		title: "活动议程生成器",
		description:
			"快速创建专业的活动议程文档，支持自定义活动信息、时间安排、角色分工和二维码管理，一键生成可打印的HTML格式文档。",
	};
}

export default function AgendaGeneratorPage() {
	return (
		<div className="container pt-32 pb-16">
			<div className="mb-8 pt-8">
				<h1 className="mb-4 font-bold text-4xl">活动议程生成器</h1>
				<p className="text-balance text-lg text-muted-foreground max-w-3xl">
					快速创建专业的活动议程文档，支持自定义活动信息、时间安排、角色分工和二维码管理，一键生成可打印的HTML格式文档。
				</p>
			</div>

			<AgendaGenerator />
		</div>
	);
}
