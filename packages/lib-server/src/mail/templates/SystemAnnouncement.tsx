import Wrapper from "../components/Wrapper";
import { Text, Hr, Heading, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface SystemAnnouncementProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	announcementType:
		| "maintenance"
		| "feature"
		| "policy"
		| "security"
		| "general";
	title: string;
	content: string;
	effectiveDate?: string;
	actionUrl?: string;
	actionText?: string;
	senderName: string;
	unsubscribeUrl: string;
}

export function SystemAnnouncement({
	locale,
	translations,
	announcementType,
	title,
	content,
	effectiveDate,
	actionUrl,
	actionText,
	senderName,
	unsubscribeUrl,
}: SystemAnnouncementProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	const typeConfig = {
		maintenance: {
			color: "#ea580c",
			background: "#fff7ed",
			icon: "🔧",
			label: t("mail.announcement.type.maintenance"),
		},
		feature: {
			color: "#059669",
			background: "#ecfdf5",
			icon: "✨",
			label: t("mail.announcement.type.feature"),
		},
		policy: {
			color: "#7c3aed",
			background: "#f3e8ff",
			icon: "📋",
			label: t("mail.announcement.type.policy"),
		},
		security: {
			color: "#dc2626",
			background: "#fef2f2",
			icon: "🔒",
			label: t("mail.announcement.type.security"),
		},
		general: {
			color: "#0ea5e9",
			background: "#f0f9ff",
			icon: "📢",
			label: t("mail.announcement.type.general"),
		},
	};

	const config = typeConfig[announcementType];

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

				<div
					style={{
						display: "inline-block",
						background: config.background,
						color: config.color,
						padding: "8px 16px",
						borderRadius: 20,
						fontSize: 13,
						fontWeight: 600,
						marginBottom: 12,
					}}
				>
					{config.icon} {config.label}
				</div>

				<Heading
					style={{
						fontSize: 22,
						fontWeight: 600,
						margin: "0 0 12px",
						color: "#000",
						lineHeight: 1.4,
					}}
				>
					{title}
				</Heading>

				<Text style={{ fontSize: 13, color: "#999", margin: 0 }}>
					{t("mail.announcement.from")} {senderName}
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

				{effectiveDate && (
					<Text
						style={{
							fontSize: 14,
							margin: "12px 0 0",
							color: "#666",
						}}
					>
						📅 {t("mail.announcement.effectiveDate")}:{" "}
						{effectiveDate}
					</Text>
				)}
			</Section>

			{actionUrl && actionText && (
				<Section style={{ marginBottom: 24 }}>
					<Text style={{ fontSize: 13, color: "#666", margin: 0 }}>
						<a
							href={actionUrl}
							style={{
								color: "#000",
								textDecoration: "underline",
								fontWeight: 500,
							}}
						>
							{actionText}
						</a>
					</Text>
				</Section>
			)}

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
