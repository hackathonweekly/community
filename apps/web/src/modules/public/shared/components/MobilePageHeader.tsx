"use client";

import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Button } from "@community/ui/ui/button";

interface MobilePageHeaderProps {
	title: string;
	onBack?: () => void;
	rightAction?: ReactNode;
}

export function MobilePageHeader({
	title,
	onBack,
	rightAction,
}: MobilePageHeaderProps) {
	const router = useRouter();

	return (
		<header className="sticky top-0 z-40 h-12 border-b border-border bg-white/95 dark:bg-[#0A0A0A]/95 px-4 backdrop-blur-sm lg:hidden">
			<div className="flex h-full items-center justify-between gap-1">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8 rounded-md"
					onClick={() => {
						if (onBack) {
							onBack();
							return;
						}
						router.back();
					}}
					aria-label="Back"
				>
					<ArrowLeftIcon className="h-4 w-4" />
				</Button>
				<h1 className="line-clamp-1 flex-1 text-center font-brand text-sm font-bold tracking-tight text-foreground">
					{title}
				</h1>
				<div className="flex h-8 min-w-[32px] items-center justify-end">
					{rightAction}
				</div>
			</div>
		</header>
	);
}
