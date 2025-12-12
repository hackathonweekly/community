"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, Link as LinkIcon, MapPin, Users } from "lucide-react";

const anchors = [
	{ id: "intro", label: "介绍" },
	{ id: "timeline", label: "流程" },
	{ id: "awards", label: "奖项" },
	{ id: "works", label: "作品" },
	{ id: "participants", label: "报名者" },
	{ id: "album", label: "相册" },
	{ id: "feedback", label: "反馈" },
];

const mockEvent = {
	title: "AI x 创意黑客松 · 上海站",
	coverImage:
		"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
	dateRange: "4月26日（周六） 10:00 - 21:00",
	location: "上海 · 徐汇滨江 198 空间",
	tags: ["线下", "黑客松", "AI 创意", "初学者友好"],
	capacity: "120 / 150",
};

const timeline = [
	{
		title: "报名 & 组队",
		time: "现在 - 4/24",
		detail: "线上报名，审核后进入报名者列表，线下可现场组队",
	},
	{
		title: "工作坊 & 主题介绍",
		time: "4/26 10:00",
		detail: "开场、AI 工具速通、过往优秀案例分享",
	},
	{
		title: "创作 & 项目提交",
		time: "4/26 11:00 - 19:00",
		detail: "现场创作，19:00 前提交作品到作品广场",
	},
	{
		title: "路演 & 投票",
		time: "4/26 19:00 - 21:00",
		detail: "线下路演 + 线上公投，评委分组点评",
	},
	{
		title: "颁奖 & 社交",
		time: "4/26 21:00",
		detail: "颁奖、合影、自由交流",
	},
];

const awards = [
	{ name: "评委大奖", desc: "综合创意、可行性、体验，3 组" },
	{ name: "大众选择奖", desc: "线上公投 Top 2" },
	{ name: "最佳新手奖", desc: "首次参赛且完成提交的最佳项目 1 组" },
];

const resources = [
	{
		title: "学习资料",
		items: ["Prompt 速查手册", "多模态生成工作流示例", "评审标准与评分表"],
	},
	{
		title: "工具推荐",
		items: ["Cursor / Windsurf", "Claude Artifacts", "V0 / Bolt.new"],
	},
];

const works = [
	{ title: "城市演化可视化", tag: "数据 + 生成式", votes: 86 },
	{ title: "AI 剧本分镜工坊", tag: "多模态", votes: 64 },
	{ title: "无障碍导航助手", tag: "社会创新", votes: 51 },
];

const participants = [
	{ name: "Lynn", role: "产品 / 设计" },
	{ name: "Ken", role: "前端 / 全栈" },
	{ name: "Ivy", role: "AI 应用" },
	{ name: "Stone", role: "数据 / 后端" },
	{ name: "Mia", role: "运营 / 主持" },
];

const albumPhotos = [
	"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
	"https://images.unsplash.com/photo-1455849318743-b2233052fcff?auto=format&fit=crop&w=800&q=80",
	"https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=800&q=80",
];

export default function LayoutPreviewPage() {
	const enabledAnchors = [
		{ id: "intro", label: "介绍" },
		{ id: "timeline", label: "流程", show: timeline.length > 0 },
		{
			id: "awards",
			label: "奖项",
			show:
				awards.length > 0 ||
				resources.some((group) => group.items.length > 0),
		},
		{ id: "works", label: "作品", show: works.length > 0 },
		{
			id: "participants",
			label: "报名者",
			show: participants.length > 0,
		},
		{ id: "album", label: "相册", show: albumPhotos.length > 0 },
		{ id: "feedback", label: "反馈", show: true },
	]
		.filter((a) => a.show ?? true)
		.map(({ id, label }) => ({ id, label }));

	return (
		<div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
			<Hero />

			<AnchorNav anchors={enabledAnchors} />

			<div className="container max-w-6xl py-10 space-y-10">
				<div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
					<div className="space-y-8">
						<SectionCard id="intro" title="活动介绍">
							<p className="text-muted-foreground leading-7">
								一次聚焦 AI + 创意的 1
								日黑客松：上午速通工具和范例，下午团队共创，晚上路演和颁奖。
								报名后可在报名者列表互相认识，现场也支持自由组队。
							</p>
						</SectionCard>

						<SectionCard id="timeline" title="流程 / 时间线">
							<ul className="space-y-3">
								{timeline.map((item) => (
									<li
										key={item.title}
										className="flex gap-3 rounded-xl border bg-white/70 p-4"
									>
										<div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
										<div className="space-y-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-semibold">
													{item.title}
												</p>
												<Badge variant="secondary">
													{item.time}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground">
												{item.detail}
											</p>
										</div>
									</li>
								))}
							</ul>
						</SectionCard>

						<SectionCard id="awards" title="奖项 & 资源">
							<div className="grid gap-4 md:grid-cols-2">
								<Card className="shadow-none border-dashed">
									<CardHeader>
										<CardTitle className="text-base">
											奖项设置
										</CardTitle>
										<CardDescription>
											便于参赛者理解评审标准
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										{awards.map((award) => (
											<div
												key={award.name}
												className="rounded-lg border bg-muted/40 p-3"
											>
												<p className="font-medium">
													{award.name}
												</p>
												<p className="text-sm text-muted-foreground">
													{award.desc}
												</p>
											</div>
										))}
									</CardContent>
								</Card>

								<Card className="shadow-none border-dashed">
									<CardHeader>
										<CardTitle className="text-base">
											准备资源
										</CardTitle>
										<CardDescription>
											提前告诉参赛者可用的工具与材料
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{resources.map((group) => (
											<div
												key={group.title}
												className="space-y-2"
											>
												<p className="font-medium">
													{group.title}
												</p>
												<ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
													{group.items.map((item) => (
														<li key={item}>
															{item}
														</li>
													))}
												</ul>
											</div>
										))}
									</CardContent>
								</Card>
							</div>
						</SectionCard>

						<SectionCard
							id="works"
							title="作品广场"
							ctaLabel="查看全部作品"
						>
							<div className="grid gap-3 md:grid-cols-3">
								{works.map((work) => (
									<Card
										key={work.title}
										className="shadow-none bg-gradient-to-br from-white to-slate-50"
									>
										<CardHeader className="pb-2">
											<CardTitle className="text-base">
												{work.title}
											</CardTitle>
											<CardDescription>
												{work.tag}
											</CardDescription>
										</CardHeader>
										<CardContent className="pt-0">
											<Badge variant="secondary">
												🔥 {work.votes} 票
											</Badge>
										</CardContent>
									</Card>
								))}
							</div>
						</SectionCard>

						<SectionCard
							id="participants"
							title="报名者信息"
							ctaLabel="查看全部报名者"
						>
							<div className="grid gap-3 sm:grid-cols-2">
								{participants.map((p) => (
									<Card
										key={p.name}
										className="shadow-none border-dashed"
									>
										<CardContent className="pt-4">
											<p className="font-medium">
												{p.name}
											</p>
											<p className="text-sm text-muted-foreground">
												{p.role}
											</p>
										</CardContent>
									</Card>
								))}
							</div>
							<p className="mt-3 text-xs text-muted-foreground">
								示意：正式页面这里可展示头像栈、允许按技能筛选，并提供“联系/组队”入口。
							</p>
						</SectionCard>

						<SectionCard
							id="album"
							title="相册预览"
							ctaLabel="进入现场相册"
						>
							<div className="grid gap-3 sm:grid-cols-3">
								{albumPhotos.map((url) => (
									<div
										key={url}
										className="aspect-[4/3] overflow-hidden rounded-xl border bg-white/70"
									>
										<img
											src={url}
											alt="活动照片示意"
											className="h-full w-full object-cover"
										/>
									</div>
								))}
							</div>
						</SectionCard>

						<SectionCard id="feedback" title="反馈 / 联系组织者">
							<div className="flex flex-wrap gap-3">
								<Button variant="secondary">
									提交活动反馈
								</Button>
								<Button variant="outline">联系组织者</Button>
								<Button variant="outline" className="gap-2">
									<LinkIcon className="h-4 w-4" />
									分享活动
								</Button>
							</div>
							<p className="mt-3 text-xs text-muted-foreground">
								示意：移动端可放在「更多操作」里，桌面端放在报名卡或固定锚点附近。
							</p>
						</SectionCard>
					</div>

					<div className="hidden lg:block">
						<RegistrationSidebar />
					</div>
				</div>
			</div>

			<MobileCTA />
		</div>
	);
}

function Hero() {
	return (
		<div className="relative isolate overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
			<div
				className="absolute inset-0 opacity-40"
				style={{
					backgroundImage: `url(${mockEvent.coverImage})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					filter: "blur(2px)",
					transform: "scale(1.05)",
				}}
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent" />
			<div className="relative container max-w-6xl py-12 space-y-4">
				<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
					<span className="h-2 w-2 rounded-full bg-emerald-400" />
					线下 · 黑客松
				</div>
				<h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
					{mockEvent.title}
				</h1>
				<div className="flex flex-wrap gap-3 text-sm text-white/90">
					<span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
						<CalendarDays className="h-4 w-4" />
						{mockEvent.dateRange}
					</span>
					<span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
						<MapPin className="h-4 w-4" />
						{mockEvent.location}
					</span>
					<span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
						<Users className="h-4 w-4" />
						{mockEvent.capacity}
					</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{mockEvent.tags.map((tag) => (
						<Badge key={tag} className="bg-white/20 text-white">
							{tag}
						</Badge>
					))}
				</div>
				<div className="flex flex-wrap gap-3 pt-2">
					<Button size="lg" className="h-11 px-6">
						立即报名（主 CTA 示意）
					</Button>
					<Button
						variant="secondary"
						className="h-11 bg-white text-indigo-700 hover:bg-white/90"
					>
						提交/修改作品
					</Button>
				</div>
			</div>
		</div>
	);
}

function AnchorNav({
	anchors,
}: {
	anchors: Array<{ id: string; label: string }>;
}) {
	return (
		<div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
			<div className="container max-w-6xl flex items-center gap-3 overflow-x-auto py-3 text-sm text-muted-foreground flex-nowrap">
				{anchors.map((anchor) => (
					<a
						key={anchor.id}
						href={`#${anchor.id}`}
						className="rounded-full px-3 py-1 transition hover:bg-slate-100 whitespace-nowrap"
					>
						{anchor.label}
					</a>
				))}
			</div>
		</div>
	);
}

function SectionCard({
	id,
	title,
	ctaLabel,
	children,
}: {
	id: string;
	title: string;
	ctaLabel?: string;
	children: React.ReactNode;
}) {
	return (
		<Card id={id} className="shadow-sm">
			<CardHeader className="flex flex-row items-center justify-between gap-3">
				<div className="space-y-1">
					<CardTitle className="text-lg">{title}</CardTitle>
					<CardDescription>
						示意布局：桌面主列，移动全宽
					</CardDescription>
				</div>
				{ctaLabel ? (
					<Button variant="ghost" size="sm" className="text-primary">
						{ctaLabel}
					</Button>
				) : null}
			</CardHeader>
			<CardContent className="space-y-4">{children}</CardContent>
		</Card>
	);
}

function RegistrationSidebar() {
	return (
		<Card className="sticky top-24 shadow-lg border-0 bg-white">
			<CardHeader>
				<CardTitle>报名 / 状态卡（示意）</CardTitle>
				<CardDescription>
					桌面右侧固定，保留主 CTA、审核状态、分享等
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<Button className="w-full h-11 text-base">立即报名</Button>
				<Button variant="outline" className="w-full h-11">
					查看重要信息
				</Button>
				<div className="rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
					<p>
						示意：在这里放报名状态、二维码、重要须知、志愿者入口。
					</p>
				</div>
				<div className="space-y-2 text-sm">
					<p className="font-medium">组织者 / 机构</p>
					<div className="rounded-lg border p-3">
						<p className="font-semibold">Hackathon Weekly</p>
						<p className="text-muted-foreground text-xs">
							可放订阅按钮、社交链接
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function MobileCTA() {
	return (
		<div
			className={cn(
				"fixed inset-x-0 bottom-0 z-30 bg-white/95 shadow-lg shadow-black/5 border-t lg:hidden",
			)}
			style={{
				paddingBottom:
					"max(1rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
			}}
		>
			<div className="container max-w-6xl py-3">
				<div className="flex gap-3">
					<Button className="flex-1 h-12 text-base">
						立即报名（移动端主 CTA）
					</Button>
					<Button variant="outline" className="h-12">
						更多操作
					</Button>
				</div>
			</div>
		</div>
	);
}
