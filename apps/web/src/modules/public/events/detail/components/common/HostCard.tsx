import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Card, CardContent, CardHeader } from "@community/ui/ui/card";
import Link from "next/link";

export function HostCard({
	title,
	name,
	username,
	image,
	highlight,
	href,
	description,
}: {
	title: string;
	name?: string | null;
	username?: string | null;
	image?: string | null;
	highlight?: string | null;
	href?: string;
	description?: string | null;
}) {
	const fallbackSource = (name ?? username ?? title).trim();
	const fallback = fallbackSource
		? Array.from(fallbackSource)[0]?.toUpperCase()
		: "?";

	const header = (
		<CardHeader className="flex flex-row items-center gap-3 space-y-0">
			<Avatar>
				{image ? <AvatarImage src={image} alt={name || title} /> : null}
				<AvatarFallback className="font-medium leading-none">
					{fallback}
				</AvatarFallback>
			</Avatar>
			<div>
				<p className="text-xs text-muted-foreground">{title}</p>
				<p className="font-medium">{name || username || "未填写"}</p>
			</div>
		</CardHeader>
	);

	const content = (
		<>
			{highlight || description ? (
				<CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
					{highlight ? <p>{highlight}</p> : null}
					{description ? (
						<p className="line-clamp-2">{description}</p>
					) : null}
				</CardContent>
			) : null}
		</>
	);

	if (href) {
		return (
			<Link href={href} className="block">
				<Card className="shadow-none border-dashed transition-colors hover:border-primary/40 hover:bg-muted/30">
					{header}
					{content}
				</Card>
			</Link>
		);
	}

	return (
		<Card className="shadow-none border-dashed">
			{header}
			{content}
		</Card>
	);
}
