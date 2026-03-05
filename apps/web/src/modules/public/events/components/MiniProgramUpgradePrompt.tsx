"use client";

import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { useTranslations } from "next-intl";

interface MiniProgramUpgradePromptProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	message?: string | null;
}

export function MiniProgramUpgradePrompt({
	open,
	onOpenChange,
	message,
}: MiniProgramUpgradePromptProps) {
	const t = useTranslations("events.registration.miniProgramUpgrade");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>
						{message?.trim() || t("description")}
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
					{t("note")}
				</div>
				<DialogFooter>
					<Button onClick={() => onOpenChange(false)}>
						{t("confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
