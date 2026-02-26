"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { sanitizeRichContent } from "@community/lib-shared/utils/sanitize-html";
import { useTranslations } from "next-intl";

interface EventDescriptionProps {
	richContent: string;
	variant?: "card" | "plain";
}

export function EventDescription({
	richContent,
	variant = "card",
}: EventDescriptionProps) {
	const t = useTranslations("events");

	// 清理 HTML 内容以防止 XSS 攻击
	const sanitizedDescription = sanitizeRichContent(richContent);

	if (variant === "plain") {
		return (
			<div className="prose prose-sm max-w-none">
				<div
					className="tiptap-content"
					dangerouslySetInnerHTML={{
						__html: sanitizedDescription,
					}}
				/>
			</div>
		);
	}

	return (
		<Card className="gap-3">
			<CardHeader>
				<CardTitle>{t("aboutThisEvent")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="prose prose-sm max-w-none">
					<div
						className="tiptap-content"
						dangerouslySetInnerHTML={{
							__html: sanitizedDescription,
						}}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
