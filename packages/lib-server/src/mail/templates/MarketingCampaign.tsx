import Wrapper from "../components/Wrapper";
import { Text, Hr, Heading, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface MarketingCampaignProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	campaignTitle: string;
	headline: string;
	content: string;
	ctaText: string;
	ctaUrl: string;
	senderName: string;
	unsubscribeUrl: string;
}

export function MarketingCampaign({
	locale,
	translations,
	campaignTitle,
	headline,
	content,
	ctaText,
	ctaUrl,
	senderName,
	unsubscribeUrl,
}: MarketingCampaignProps) {
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

				<Text
					style={{
						fontSize: 12,
						color: "#999",
						margin: "0 0 12px",
						textAlign: "center",
					}}
				>
					{campaignTitle}
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
					{headline}
				</Heading>

				<Text style={{ fontSize: 13, color: "#999", margin: 0 }}>
					{t("mail.marketing.from")} {senderName}
				</Text>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section style={{ marginBottom: 24 }}>
				<div
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
					}}
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			</Section>

			<Section style={{ marginBottom: 24 }}>
				<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
					<a
						href={ctaUrl}
						style={{
							color: "#000",
							textDecoration: "underline",
							fontWeight: 500,
						}}
					>
						{ctaText}
					</a>
				</Text>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			<Section>
				<Text
					style={{ fontSize: 12, color: "#999", margin: "0 0 8px" }}
				>
					© {new Date().getFullYear()} HackathonWeekly Team
				</Text>
				<Text style={{ fontSize: 12, color: "#999", margin: 0 }}>
					<a
						href={unsubscribeUrl}
						style={{
							color: "#999",
							textDecoration: "underline",
						}}
					>
						{t("mail.common.unsubscribe")}
					</a>
				</Text>
			</Section>
		</Wrapper>
	);
}
