import { Text, Hr, Heading, Section } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import Wrapper from "../components/Wrapper";
import { defaultTranslations } from "../translations";
import { defaultLocale } from "../translations";
import type { BaseMailProps } from "../types";

export function NewUser({
	url,
	name,
	otp,
	locale,
	translations,
}: {
	url: string;
	name: string;
	otp: string;
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
					{t("mail.newUser.confirmEmail")}
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
					{t("mail.newUser.body", { name })}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "0 0 12px",
					}}
				>
					{t("mail.common.otp")}
				</Text>

				<div
					style={{
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: 8,
						padding: 16,
						margin: "0 0 12px",
						textAlign: "center",
					}}
				>
					<Text
						style={{
							fontSize: 24,
							fontWeight: 700,
							color: "#000",
							margin: 0,
							letterSpacing: 4,
						}}
					>
						{otp}
					</Text>
				</div>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: 0,
					}}
				>
					{t("mail.common.useLink")}
				</Text>

				<Text
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
						margin: "12px 0 0",
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
						{t("mail.newUser.confirmEmail")} →
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

NewUser.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
	name: "John Doe",
	otp: "123456",
};

export default NewUser;
