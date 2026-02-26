import { config } from "@community/config";
import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { cn } from "../lib/utils";
import { forwardRef, useMemo } from "react";

export const UserAvatar = forwardRef<
	HTMLSpanElement,
	{
		name: string;
		avatarUrl?: string | null;
		className?: string;
		fallbackClassName?: string;
	}
>(({ name, avatarUrl, className, fallbackClassName }, ref) => {
	const initials = useMemo(
		() =>
			name
				.split(" ")
				.slice(0, 2)
				.map((n) => n[0])
				.join(""),
		[name],
	);

	const avatarSrc = useMemo(
		() =>
			avatarUrl
				? avatarUrl.startsWith("http")
					? avatarUrl
					: `${config.storage.endpoints.public}/${avatarUrl}`
				: undefined,
		[avatarUrl],
	);

	return (
		<Avatar ref={ref} className={className}>
			<AvatarImage src={avatarSrc} />
			<AvatarFallback
				className={cn(
					"bg-secondary/10 text-secondary-foreground",
					fallbackClassName,
				)}
			>
				{initials}
			</AvatarFallback>
		</Avatar>
	);
});

UserAvatar.displayName = "UserAvatar";
