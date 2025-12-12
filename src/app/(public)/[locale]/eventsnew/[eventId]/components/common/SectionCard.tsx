import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SectionCard({
	id,
	title,
	ctaLabel,
	ctaHref,
	children,
}: {
	id: string;
	title: string;
	ctaLabel?: string;
	ctaHref?: string;
	children: React.ReactNode;
}) {
	return (
		<Card id={id} className="shadow-sm scroll-mt-28">
			<CardHeader className="flex flex-row items-center justify-between gap-3">
				<CardTitle className="text-lg">{title}</CardTitle>
				{ctaLabel ? (
					<Button
						variant="ghost"
						size="sm"
						className="text-primary"
						asChild={Boolean(ctaHref)}
					>
						{ctaHref ? <a href={ctaHref}>{ctaLabel}</a> : ctaLabel}
					</Button>
				) : null}
			</CardHeader>
			<CardContent className="space-y-4">{children}</CardContent>
		</Card>
	);
}
