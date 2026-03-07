import {
	Container,
	Font,
	Head,
	Html,
	Section,
	Tailwind,
} from "@react-email/components";
import React, { type PropsWithChildren } from "react";

export default function Wrapper({ children }: PropsWithChildren) {
	return (
		<Html lang="en">
			<Head>
				<Font
					fontFamily="Inter"
					fallbackFontFamily="Arial"
					fontWeight={400}
					fontStyle="normal"
				/>
			</Head>
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								border: "#e5e5e5",
								background: "#ffffff",
								foreground: "#000000",
							},
						},
					},
				}}
			>
				<Section className="bg-background p-4">
					<Container className="bg-card p-6">{children}</Container>
				</Section>
			</Tailwind>
		</Html>
	);
}
