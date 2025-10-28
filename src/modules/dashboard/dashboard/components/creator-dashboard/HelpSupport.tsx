import { ContactModal } from "@/modules/public/intro/components/ContactModal";
import { LocaleLink } from "@i18n/routing";
import { BookOpen, HelpCircle, MessageCircle, Award } from "lucide-react";

interface HelpItem {
	title: string;
	description: string;
	icon: any;
	type: "link" | "modal";
	href?: string;
}

export function HelpSupport() {
	const helpItems: HelpItem[] = [
		{
			title: "使用指南",
			description: "了解平台功能",
			icon: BookOpen,
			type: "link",
			href: "/docs",
		},
		{
			title: "常见问题",
			description: "快速找到答案",
			icon: HelpCircle,
			type: "link",
			href: "/docs/faq",
		},
		{
			title: "联系客服",
			description: "获得人工帮助",
			icon: MessageCircle,
			type: "modal",
		},
		{
			title: "功能建议",
			description: "参与产品改进",
			icon: Award,
			type: "link",
			href: "/docs/user-level-system",
		},
	];

	return (
		<div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-gray-900 mb-6">
				帮助与支持
			</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{helpItems.map((item) => (
					<div key={item.title}>
						{item.type === "modal" ? (
							<ContactModal>
								<div className="group cursor-pointer">
									<div className="flex flex-col items-center p-4 rounded-xl bg-white/60 border border-indigo-200 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200">
										<div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
											<item.icon className="h-5 w-5 text-indigo-700" />
										</div>
										<div className="text-center">
											<div className="font-medium text-sm text-gray-900 group-hover:text-indigo-700 transition-colors mb-1">
												{item.title}
											</div>
											<div className="text-xs text-gray-600">
												{item.description}
											</div>
										</div>
									</div>
								</div>
							</ContactModal>
						) : (
							<LocaleLink href={item.href!}>
								<div className="group">
									<div className="flex flex-col items-center p-4 rounded-xl bg-white/60 border border-indigo-200 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200">
										<div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
											<item.icon className="h-5 w-5 text-indigo-700" />
										</div>
										<div className="text-center">
											<div className="font-medium text-sm text-gray-900 group-hover:text-indigo-700 transition-colors mb-1">
												{item.title}
											</div>
											<div className="text-xs text-gray-600">
												{item.description}
											</div>
										</div>
									</div>
								</div>
							</LocaleLink>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
