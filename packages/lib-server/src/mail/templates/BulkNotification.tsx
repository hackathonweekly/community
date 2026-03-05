import Wrapper from "../components/Wrapper";
import PrimaryButton from "../components/PrimaryButton";
import { Logo } from "../components/Logo";
import { Text, Hr, Heading, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface BulkNotificationProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	title: string;
	content: string;
	senderName: string;
	organizationName?: string;
	organizationLogo?: string;
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
	organizationName,
	organizationLogo,
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
			<Section style={{ textAlign: "center", marginBottom: 32 }}>
				{organizationLogo ? (
					<img
						src={organizationLogo}
						alt={organizationName}
						style={{ height: 48, marginBottom: 16 }}
					/>
				) : (
					<Logo />
				)}

				{/* 优先级标识 */}
				<div
					style={{
						display: "inline-block",
						background: config.background,
						color: config.color,
						padding: "8px 16px",
						borderRadius: 20,
						fontSize: 14,
						fontWeight: 600,
						marginBottom: 16,
						border: `1px solid ${config.color}20`,
					}}
				>
					{config.icon} {config.label}
				</div>

				<Heading
					style={{
						fontSize: 28,
						fontWeight: 700,
						margin: "16px 0",
						color:
							priority === "urgent" || priority === "high"
								? config.color
								: "#1f2937",
					}}
				>
					{title}
				</Heading>

				<Text style={{ fontSize: 16, color: "#666", margin: 0 }}>
					{t("mail.notification.from")} {senderName}
					{organizationName && ` • ${organizationName}`}
				</Text>
			</Section>

			<Hr style={{ margin: "32px 0" }} />

			{/* 通知内容 */}
			<Section style={{ marginBottom: 32 }}>
				<div
					style={{
						background: "#ffffff",
						borderRadius: 12,
						padding: 24,
						border: "1px solid #e5e7eb",
						fontSize: 16,
						lineHeight: 1.6,
						color: "#374151",
					}}
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			</Section>

			{/* 行动按钮 */}
			{actionUrl && actionText && (
				<Section style={{ textAlign: "center", marginBottom: 32 }}>
					<PrimaryButton href={actionUrl}>
						{actionText} →
					</PrimaryButton>
				</Section>
			)}

			{/* 重要提醒（高优先级和紧急） */}
			{(priority === "high" || priority === "urgent") && (
				<Section style={{ marginBottom: 32 }}>
					<div
						style={{
							background:
								priority === "urgent" ? "#fef2f2" : "#fff7ed",
							borderLeft: `4px solid ${config.color}`,
							borderRadius: 8,
							padding: 16,
						}}
					>
						<Text
							style={{
								fontSize: 14,
								color: config.color,
								fontWeight: 600,
								margin: "0 0 8px",
							}}
						>
							{priority === "urgent" ? "🚨 " : "⚠️ "}
							{t(`mail.notification.importance.${priority}`)}
						</Text>
						<Text
							style={{
								fontSize: 14,
								margin: 0,
								color: "#374151",
							}}
						>
							{t(
								`mail.notification.importanceDescription.${priority}`,
							)}
						</Text>
					</div>
				</Section>
			)}

			{/* 页脚信息 */}
			<Hr style={{ margin: "32px 0" }} />
			<Section style={{ textAlign: "center" }}>
				<Text
					style={{ fontSize: 14, color: "#666", margin: "0 0 16px" }}
				>
					{t("mail.notification.footer")}{" "}
					{new Date().toLocaleDateString(
						locale === "zh" ? "zh-CN" : "en-US",
						{
							year: "numeric",
							month: "long",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						},
					)}
				</Text>

				{/* 联系信息 */}
				<Text
					style={{ fontSize: 12, color: "#999", margin: "0 0 16px" }}
				>
					{t("mail.notification.questions")}{" "}
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

				{/* 退订链接 */}
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
