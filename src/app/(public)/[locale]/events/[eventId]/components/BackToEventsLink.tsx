"use client";
import { LocaleLink } from "@/modules/i18n/routing";
import { ArrowLeft } from "lucide-react";

export function BackToEventsLink({ label }: { label: string }) {
	return (
		<LocaleLink
			href="/events"
			className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
		>
			<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
			<span>{label}</span>
		</LocaleLink>
	);
}
