import type { JSXElementConstructor } from "react";

type IconProps = {
	className?: string;
};

export const oAuthProviders = {
	wechat: {
		name: "WeChat",
		icon: ({ ...props }: IconProps) => (
			<svg viewBox="0 0 24 24" {...props}>
				<title>WeChat</title>
				<path
					d="M8.5 2C4.4 2 1 4.9 1 8.5c0 2.1 1.1 3.9 2.8 5.1l-.6 2.2c-.1.3.2.6.5.5l2.4-1.2c.7.2 1.4.3 2.2.3 4.1 0 7.5-2.9 7.5-6.5S12.6 2 8.5 2zm-2 5.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm4 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zM15.5 9c-3.3 0-6 2.2-6 5s2.7 5 6 5c.6 0 1.2-.1 1.8-.2l1.9 1c.2.1.5-.1.4-.4l-.5-1.7c1.3-1 2.1-2.4 2.1-4C21.5 11.2 18.8 9 15.5 9zm-2.5 3c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm3 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z"
					fill="currentColor"
				/>
			</svg>
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
