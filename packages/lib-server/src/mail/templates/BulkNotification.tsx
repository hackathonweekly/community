import Wrapper from "../components/Wrapper";
import { Text, Hr, Heading, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface BulkNotificationProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	title: string;
	content: string;
	senderName: string;
	actionUrl?: string;
	actionText?: string;
	priority: "low" | "normal" | "high" | "urgent";
	unsubscribeUrl: string;
}

export function BulkNotification({
	locale,
	translations,
	title,
	content,
	senderName,
	actionUrl,
	actionText,
	priority,
	unsubscribeUrl,
}: BulkNotificationProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	const priorityConfig = {
		low: {
			color: "#64748b",
			background: "#f1f5f9",
			icon: "ℹ️",
			label: t("mail.notification.priority.low"),
		},
		normal: {
			color: "#0ea5e9",
			background: "#f0f9ff",
			icon: "📢",
			label: t("mail.notification.priority.normal"),
		},
		high: {
			color: "#ea580c",
			background: "#fff7ed",
			icon: "⚠️",
			label: t("mail.notification.priority.high"),
		},
		urgent: {
			color: "#dc2626",
			background: "#fef2f2",
			icon: "🚨",
			label: t("mail.notification.priority.urgent"),
		},
	};

	const config = priorityConfig[priority];

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
						color:
							priority === "urgent" || priority === "high"
								? config.color
								: "#000",
						lineHeight: 1.4,
					}}
				>
					{title}
				</Heading>

				<Text style={{ fontSize: 13, color: "#999", margin: 0 }}>
					{t("mail.notification.from")} {senderName}
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
