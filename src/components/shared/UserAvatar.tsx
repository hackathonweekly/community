import { config } from "@/config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { forwardRef, useMemo } from "react";

export const UserAvatar = forwardRef<
	HTMLSpanElement,
	{
		name: string;
		avatarUrl?: string | null;
		className?: string;
	}
>(({ name, avatarUrl, className }, ref) => {
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
			<AvatarFallback className="bg-secondary/10 text-secondary">
				{initials}
			</AvatarFallback>
		</Avatar>
	);
});

UserAvatar.displayName = "UserAvatar";
