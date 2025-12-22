import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function HostCard({
	title,
	name,
	username,
	image,
	highlight,
}: {
	title: string;
	name?: string | null;
	username?: string | null;
	image?: string | null;
	highlight?: string | null;
}) {
	const fallbackSource = (name ?? username ?? title).trim();
	const fallback = fallbackSource
		? Array.from(fallbackSource)[0]?.toUpperCase()
		: "?";

	return (
		<Card className="shadow-none border-dashed">
			<CardHeader className="flex flex-row items-center gap-3 space-y-0">
				<Avatar>
					{image ? (
						<AvatarImage src={image} alt={name || title} />
					) : null}
					<AvatarFallback className="font-medium leading-none">
						{fallback}
					</AvatarFallback>
				</Avatar>
				<div>
					<p className="text-xs text-muted-foreground">{title}</p>
					<p className="font-medium">
						{name || username || "未填写"}
					</p>
				</div>
			</CardHeader>
			{highlight ? (
				<CardContent className="pt-0 text-sm text-muted-foreground">
					{highlight}
				</CardContent>
			) : null}
		</Card>
	);
}
