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
	const fallback =
		name?.[0]?.toUpperCase() || username?.[0]?.toUpperCase() || title[0];

	return (
		<Card className="shadow-none border-dashed">
			<CardHeader className="flex flex-row items-center gap-3 space-y-0">
				<Avatar>
					{image ? (
						<AvatarImage src={image} alt={name || title} />
					) : null}
					<AvatarFallback>{fallback}</AvatarFallback>
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
