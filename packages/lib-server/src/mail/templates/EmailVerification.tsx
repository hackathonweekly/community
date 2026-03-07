import { Text, Hr, Heading, Section } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../translations";
import type { BaseMailProps } from "../types";

export function EmailVerification({
	url,
	name,
	locale,
	translations,
}: {
	url: string;
	name: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Section style={{ marginBottom: 24 }}>
				<Text
					style={{
						fontSize: 13,
						color: "#999",
						margin: "0 0 20px",
						textAlign: "center",
					}}
				>
					{locale === "zh"
						? "周周黑客松 HackathonWeekly"
						: "HackathonWeekly"}
				</Text>

				<Heading
					style={{
						fontSize: 22,
						fontWeight: 600,
						margin: "0 0 12px",
						color: "#000",
						lineHeight: 1.4,
					}}
				>
					{t("mail.emailVerification.confirmEmail")}
				</Heading>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section style={{ marginBottom: 24 }}>
				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{t("mail.emailVerification.body", { name })}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: 0,
					}}
				>
					<a
						href={url}
						style={{
							color: "#0ea5e9",
							textDecoration: "underline",
							fontWeight: 500,
						}}
					>
						{t("mail.emailVerification.confirmEmail")} →
					</a>
				</Text>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section>
				<Text style={{ fontSize: 12, color: "#999", margin: 0 }}>
					© {new Date().getFullYear()} HackathonWeekly Team
				</Text>
			</Section>
		</Wrapper>
	);
}

EmailVerification.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
	name: "John Doe",
};

export default EmailVerification;
