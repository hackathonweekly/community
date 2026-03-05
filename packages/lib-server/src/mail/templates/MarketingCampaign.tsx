import Wrapper from "../components/Wrapper";
import PrimaryButton from "../components/PrimaryButton";
import { Logo } from "../components/Logo";
import {
	Text,
	Hr,
	Heading,
	Section,
	Row,
	Column,
} from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface MarketingCampaignProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	campaignTitle: string;
	heroImage?: string;
	headline: string;
	subheadline?: string;
	content: string;
	features?: Array<{
		icon: string;
		title: string;
		description: string;
	}>;
	testimonials?: Array<{
		name: string;
		role: string;
		avatar?: string;
		quote: string;
	}>;
	ctaText: string;
	ctaUrl: string;
	secondaryCtaText?: string;
	secondaryCtaUrl?: string;
	organizationName?: string;
	senderName: string;
	unsubscribeUrl: string;
}

export function MarketingCampaign({
	locale,
	translations,
	campaignTitle,
	heroImage,
	headline,
	subheadline,
	content,
	features,
	testimonials,
	ctaText,
	ctaUrl,
	secondaryCtaText,
	secondaryCtaUrl,
	organizationName,
	senderName,
	unsubscribeUrl,
}: MarketingCampaignProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			{/* 邮件头部 */}
			<Section style={{ textAlign: "center", marginBottom: 32 }}>
				<Logo />
				<Text
					style={{ fontSize: 12, color: "#666", margin: "16px 0 0" }}
				>
					{campaignTitle}
				</Text>
			</Section>

			{/* Hero 区域 */}
			<Section style={{ marginBottom: 32 }}>
				{heroImage && (
					<img
						src={heroImage}
						alt={headline}
						style={{
							width: "100%",
							maxWidth: 600,
							height: "auto",
							borderRadius: 12,
							marginBottom: 24,
						}}
					/>
				)}

				<div style={{ textAlign: "center", padding: "24px 0" }}>
					<Heading
						style={{
							fontSize: 36,
							fontWeight: 800,
							margin: "0 0 16px",
							color: "#1f2937",
							lineHeight: 1.2,
						}}
					>
						{headline}
					</Heading>

					{subheadline && (
						<Text
							style={{
								fontSize: 20,
								color: "#6b7280",
								margin: "0 0 24px",
								lineHeight: 1.4,
							}}
						>
							{subheadline}
						</Text>
					)}

					<PrimaryButton href={ctaUrl}>{ctaText} →</PrimaryButton>
				</div>
			</Section>

			<Hr style={{ margin: "40px 0" }} />

			{/* 主要内容 */}
			<Section style={{ marginBottom: 40 }}>
				<div
					style={{
						fontSize: 16,
						lineHeight: 1.6,
						color: "#374151",
					}}
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			</Section>

			{/* 功能特性 */}
			{features && features.length > 0 && (
				<Section style={{ marginBottom: 40 }}>
					<Heading
						style={{
							fontSize: 24,
							fontWeight: 700,
							textAlign: "center",
							marginBottom: 32,
							color: "#1f2937",
						}}
					>
						✨ {t("mail.marketing.featuresTitle")}
					</Heading>

					{features.map((feature, index) => (
						<div
							key={index}
							style={{
								display: "flex",
								marginBottom: 24,
								padding: 20,
								background: "#f9fafb",
								borderRadius: 12,
								border: "1px solid #e5e7eb",
							}}
						>
							<div
								style={{
									fontSize: 24,
									marginRight: 16,
									minWidth: 40,
									textAlign: "center",
								}}
							>
								{feature.icon}
							</div>
							<div>
								<Text
									style={{
										fontSize: 18,
										fontWeight: 600,
										margin: "0 0 8px",
										color: "#1f2937",
									}}
								>
									{feature.title}
								</Text>
								<Text
									style={{
										fontSize: 16,
										margin: 0,
										color: "#6b7280",
										lineHeight: 1.5,
									}}
								>
									{feature.description}
								</Text>
							</div>
						</div>
					))}
				</Section>
			)}

			{/* 用户推荐 */}
			{testimonials && testimonials.length > 0 && (
				<Section style={{ marginBottom: 40 }}>
					<Heading
						style={{
							fontSize: 24,
							fontWeight: 700,
							textAlign: "center",
							marginBottom: 32,
							color: "#1f2937",
						}}
					>
						💬 {t("mail.marketing.testimonialsTitle")}
					</Heading>

					<Row>
						{testimonials.slice(0, 2).map((testimonial, index) => (
							<Column
								key={index}
								style={{ width: "50%", padding: "0 12px" }}
							>
								<div
									style={{
										background: "#ffffff",
										borderRadius: 12,
										padding: 20,
										border: "1px solid #e5e7eb",
										marginBottom: 16,
									}}
								>
									<Text
										style={{
											fontSize: 16,
											fontStyle: "italic",
											margin: "0 0 16px",
											color: "#374151",
											lineHeight: 1.5,
										}}
									>
										"{testimonial.quote}"
									</Text>

									<div
										style={{
											display: "flex",
											alignItems: "center",
										}}
									>
										{testimonial.avatar && (
											<img
												src={testimonial.avatar}
												alt={testimonial.name}
												style={{
													width: 40,
													height: 40,
													borderRadius: "50%",
													marginRight: 12,
												}}
											/>
										)}
										<div>
											<Text
												style={{
													fontSize: 14,
													fontWeight: 600,
													margin: 0,
													color: "#1f2937",
												}}
											>
												{testimonial.name}
											</Text>
											<Text
												style={{
													fontSize: 12,
													margin: 0,
													color: "#6b7280",
												}}
											>
												{testimonial.role}
											</Text>
										</div>
									</div>
								</div>
							</Column>
						))}
					</Row>
				</Section>
			)}

			{/* CTA 区域 */}
			<Section style={{ textAlign: "center", marginBottom: 40 }}>
				<div
					style={{
						background:
							"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						borderRadius: 16,
						padding: 32,
						color: "white",
					}}
				>
					<Heading
						style={{
							fontSize: 28,
							fontWeight: 700,
							margin: "0 0 16px",
							color: "white",
						}}
					>
						🚀 {t("mail.marketing.ctaTitle")}
					</Heading>

					<Text
						style={{
							fontSize: 18,
							margin: "0 0 24px",
							color: "white",
							opacity: 0.9,
						}}
					>
						{t("mail.marketing.ctaDescription")}
					</Text>

					<PrimaryButton href={ctaUrl}>{ctaText} →</PrimaryButton>

					{secondaryCtaUrl && secondaryCtaText && (
						<a
							href={secondaryCtaUrl}
							style={{
								display: "inline-block",
								color: "white",
								fontSize: 16,
								textDecoration: "underline",
								marginTop: 16,
							}}
						>
							{secondaryCtaText}
						</a>
					)}
				</div>
			</Section>

			{/* 社交分享 */}
			<Section style={{ textAlign: "center", marginBottom: 32 }}>
				<Text
					style={{
						fontSize: 16,
						margin: "0 0 16px",
						color: "#6b7280",
					}}
				>
					📢 {t("mail.marketing.shareText")}
				</Text>
				<div>
					<a
						href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(headline)}&url=${encodeURIComponent(ctaUrl)}`}
						style={{
							display: "inline-block",
							background: "#1da1f2",
							color: "white",
							padding: "8px 16px",
							borderRadius: 6,
							textDecoration: "none",
							fontSize: 14,
							marginRight: 8,
						}}
					>
						🐦 Twitter
					</a>
					<a
						href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ctaUrl)}`}
						style={{
							display: "inline-block",
							background: "#0077b5",
							color: "white",
							padding: "8px 16px",
							borderRadius: 6,
							textDecoration: "none",
							fontSize: 14,
						}}
					>
						💼 LinkedIn
					</a>
				</div>
			</Section>

			{/* 页脚 */}
			<Hr style={{ margin: "32px 0" }} />
			<Section style={{ textAlign: "center" }}>
				<Text
					style={{ fontSize: 14, color: "#666", margin: "0 0 8px" }}
				>
					{t("mail.marketing.from")} {senderName}
					{organizationName && ` @ ${organizationName}`}
				</Text>

				<Text
					style={{ fontSize: 12, color: "#999", margin: "0 0 16px" }}
				>
					{t("mail.marketing.questions")}{" "}
					<a
						href="mailto:support@hackathonweekly.com"
						style={{
							color: "#0ea5e9",
							textDecoration: "underline",
						}}
					>
						support@hackathonweekly.com
					</a>
				</Text>

				<Text style={{ fontSize: 12, color: "#999", margin: 0 }}>
					{t("mail.common.unsubscribe")}{" "}
					<a
						href={unsubscribeUrl}
						style={{
							color: "#0ea5e9",
							textDecoration: "underline",
						}}
					>
						{t("mail.common.clickHere")}
					</a>
				</Text>
			</Section>
		</Wrapper>
	);
}
