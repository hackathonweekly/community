import {
	HelpCircle,
	Info,
	Users,
	MessageCircle,
	Mail,
	ExternalLink,
	FileText,
} from "lucide-react";
import Link from "next/link";

interface FooterLinkProps {
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	href: string;
	external?: boolean;
}

function FooterLink({
	title,
	description,
	icon: Icon,
	href,
	external = false,
}: FooterLinkProps) {
	const LinkComponent = external ? "a" : Link;
	const linkProps = external
		? { href, target: "_blank", rel: "noopener noreferrer" }
		: { href };

	return (
		<LinkComponent
			{...linkProps}
			className="group flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
		>
			<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
				<Icon className="h-4 w-4 text-blue-600" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
					{title}
				</div>
				<div className="text-xs text-gray-500">{description}</div>
			</div>
			{external && (
				<ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
			)}
		</LinkComponent>
	);
}

export function FooterLinks() {
	const footerLinks: FooterLinkProps[] = [
		{
			title: "帮助支持",
			description: "使用指南",
			icon: HelpCircle,
			href: "/docs/support",
		},
		{
			title: "关于我们",
			description: "了解平台",
			icon: Info,
			href: "/about",
		},
		{
			title: "参与模式",
			description: "参与方式",
			icon: Users,
			href: "/docs/participation",
		},
		{
			title: "常见问题",
			description: "问题解答",
			icon: MessageCircle,
			href: "/docs/faq",
		},
		{
			title: "联系我们",
			description: "反馈建议",
			icon: Mail,
			href: "mailto:contact@hackathon-weekly.com",
			external: true,
		},
		{
			title: "飞书文档",
			description: "详细文档",
			icon: FileText,
			href: "https://docs.hackathonweekly.com",
			external: true,
		},
	];

	return (
		<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
			<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
				帮助与支持
			</h3>
			<div className="flex flex-wrap gap-2 sm:hidden">
				{/* 移动端：一行显示，简化文字 */}
				{footerLinks.map((link) => {
					const LinkComponent = link.external ? "a" : Link;
					const linkProps = link.external
						? {
								href: link.href,
								target: "_blank",
								rel: "noopener noreferrer",
							}
						: { href: link.href };

					return (
						<LinkComponent
							{...linkProps}
							key={link.href}
							className="flex items-center gap-1 px-2 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
						>
							<link.icon className="h-3 w-3" />
							<span>{link.title}</span>
						</LinkComponent>
					);
				})}
			</div>
			<div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{footerLinks.map((link) => (
					<FooterLink
						key={link.href}
						title={link.title}
						description={link.description}
						icon={link.icon}
						href={link.href}
						external={link.external}
					/>
				))}
			</div>
		</div>
	);
}

export function FooterLinksSkeleton() {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
			<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
				<div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
			</h3>
			{/* 移动端骨架：一行显示 */}
			<div className="flex flex-wrap gap-2 sm:hidden">
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className="flex items-center gap-1 px-2 py-1.5 bg-gray-200 animate-pulse rounded-md"
					>
						<div className="h-3 w-3 bg-gray-300 animate-pulse rounded" />
						<div className="h-3 w-12 bg-gray-300 animate-pulse rounded" />
					</div>
				))}
			</div>
			{/* 桌面端骨架 */}
			<div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white"
					>
						<div className="w-8 h-8 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
						<div className="flex-1 min-w-0 space-y-2">
							<div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
							<div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
