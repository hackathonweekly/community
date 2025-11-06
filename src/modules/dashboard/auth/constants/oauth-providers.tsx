import type { JSXElementConstructor } from "react";
import Image from "next/image";

type IconProps = {
	className?: string;
};

export const oAuthProviders = {
	wechat: {
		name: "WeChat",
		icon: ({ className, ...props }: IconProps) => (
			<Image
				src="/images/wechat_btn.svg"
				alt="WeChat"
				width={28}
				height={28}
				className={className}
				{...props}
			/>
		),
	},
} as const satisfies Record<
	string,
	{
		name: string;
		icon: JSXElementConstructor<React.SVGProps<SVGSVGElement>>;
	}
>;

export type OAuthProvider = keyof typeof oAuthProviders;
