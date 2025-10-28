"use client";

import { cn } from "@/lib/utils";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";

export type MenuItem = {
	label: string;
	href?: string;
	icon: LucideIcon;
	children?: MenuItem[];
	adminOnly?: boolean;
	badge?: ReactNode;
	description?: string;
};

type UnifiedNavMenuProps = {
	items: MenuItem[];
	onNavigate?: () => void;
	className?: string;
};

export function UnifiedNavMenu({
	items,
	onNavigate,
	className,
}: UnifiedNavMenuProps) {
	const pathname = usePathname();

	return (
		<ul className={cn("space-y-0.5", className)}>
			{items.map((item, index) => (
				<NavMenuItem
					key={item.href || `group-${index}`}
					item={item}
					pathname={pathname}
					onNavigate={onNavigate}
				/>
			))}
		</ul>
	);
}

function NavMenuItem({
	item,
	pathname,
	onNavigate,
}: {
	item: MenuItem;
	pathname: string;
	onNavigate?: () => void;
}) {
	// 检查当前项或其子项是否激活
	// 只在路径完全匹配时激活，避免 basePath 匹配所有子路径
	const isActive = item.href ? pathname === item.href : false;

	const isGroupActive = item.children?.some(
		(child) => child.href && pathname === child.href,
	);

	// 父菜单状态：如果有子项激活，默认展开
	const [isOpen, setIsOpen] = useState(isGroupActive ?? false);

	// 当路由变化时，自动展开包含当前路由的分组
	useEffect(() => {
		if (isGroupActive) {
			setIsOpen(true);
		}
	}, [isGroupActive]);

	// 如果有子菜单，渲染可折叠组
	if (item.children && item.children.length > 0) {
		return (
			<li>
				<Collapsible open={isOpen} onOpenChange={setIsOpen}>
					<CollapsibleTrigger
						className={cn(
							"flex w-full items-center gap-2.5 px-3 py-2 rounded-xl transition-colors",
							"hover:bg-accent hover:text-foreground",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
							isGroupActive
								? "bg-primary/5 text-foreground font-medium"
								: "text-foreground/70",
						)}
					>
						<item.icon className="size-4 shrink-0" />
						<span className="flex-1 text-left text-sm">
							{item.label}
						</span>
						{item.badge && (
							<span className="inline-flex items-center justify-center size-5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
								{item.badge}
							</span>
						)}
						<ChevronDown
							className={cn(
								"size-4 shrink-0 transition-transform duration-200",
								isOpen && "rotate-180",
							)}
						/>
					</CollapsibleTrigger>
					<CollapsibleContent className="overflow-hidden transition-all data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
						<ul className="mt-1 ml-6 space-y-0.5 border-l-2 border-border/50 pl-3 py-1">
							{item.children.map((child, childIndex) => (
								<NavMenuItem
									key={child.href || `child-${childIndex}`}
									item={child}
									pathname={pathname}
									onNavigate={onNavigate}
								/>
							))}
						</ul>
					</CollapsibleContent>
				</Collapsible>
			</li>
		);
	}

	// 普通菜单项
	if (!item.href) {
		return null;
	}

	return (
		<li>
			<Link
				href={item.href}
				onClick={onNavigate}
				className={cn(
					"flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-sm",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
					isActive
						? "bg-primary/10 font-semibold text-foreground shadow-sm"
						: "text-foreground/70 hover:bg-accent hover:text-foreground",
				)}
			>
				<item.icon className="size-4 shrink-0" />
				<span className="flex-1">{item.label}</span>
				{item.badge && (
					<span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
						{item.badge}
					</span>
				)}
			</Link>
		</li>
	);
}
