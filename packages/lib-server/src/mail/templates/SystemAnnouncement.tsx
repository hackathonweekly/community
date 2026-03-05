import Wrapper from "../components/Wrapper";
import PrimaryButton from "../components/PrimaryButton";
import { Logo } from "../components/Logo";
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
	actionRequired?: boolean;
	actionUrl?: string;
	actionText?: string;
	deadline?: string;
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
	actionRequired,
	actionUrl,
	actionText,
	deadline,
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
			<Section style={{ textAlign: "center", marginBottom: 32 }}>
				<Logo />

				{/* 公告类型标识 */}
				<div
					style={{
						display: "inline-block",
						background: config.background,
						color: config.color,
						padding: "12px 24px",
						borderRadius: 25,
						fontSize: 16,
						fontWeight: 700,
						marginTop: 24,
						border: `2px solid ${config.color}30`,
					}}
				>
					{config.icon} {config.label}
				</div>

				<Heading
					style={{
						fontSize: 32,
						fontWeight: 800,
						margin: "24px 0 8px",
						color: "#1f2937",
						lineHeight: 1.2,
					}}
				>
					{title}
				</Heading>

				<Text style={{ fontSize: 16, color: "#6b7280", margin: 0 }}>
					{t("mail.announcement.from")} {senderName}
				</Text>
			</Section>

			{/* 重要信息栏 */}
			{(effectiveDate || deadline || actionRequired) && (
				<Section style={{ marginBottom: 32 }}>
					<div
						style={{
							background: actionRequired ? "#fef2f2" : "#f0f9ff",
							borderLeft: `4px solid ${actionRequired ? "#dc2626" : "#0ea5e9"}`,
							borderRadius: 8,
							padding: 20,
						}}
					>
						{actionRequired && (
							<Text
								style={{
									fontSize: 16,
									color: "#dc2626",
									fontWeight: 700,
									margin: "0 0 12px",
									display: "flex",
									alignItems: "center",
								}}
							>
								⚠️ {t("mail.announcement.actionRequired")}
							</Text>
						)}

						{effectiveDate && (
							<Text
								style={{
									fontSize: 14,
									margin: "0 0 8px",
									color: "#374151",
								}}
							>
								📅{" "}
								<strong>
									{t("mail.announcement.effectiveDate")}:
								</strong>{" "}
								{effectiveDate}
							</Text>
						)}

						{deadline && (
							<Text
								style={{
									fontSize: 14,
									margin: "0 0 8px",
									color: "#374151",
								}}
							>
								⏰{" "}
								<strong>
									{t("mail.announcement.deadline")}:
								</strong>{" "}
								{deadline}
							</Text>
						)}
					</div>
				</Section>
			)}

			<Hr style={{ margin: "32px 0" }} />

			{/* 公告内容 */}
			<Section style={{ marginBottom: 32 }}>
				<div
					style={{
						fontSize: 16,
						lineHeight: 1.6,
						color: "#374151",
						padding: "0 8px",
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

			{/* 安全提醒（针对安全类公告） */}
			{announcementType === "security" && (
				<Section style={{ marginBottom: 32 }}>
					<div
						style={{
							background: "#fef2f2",
							borderRadius: 12,
							padding: 20,
							border: "2px solid #fecaca",
						}}
					>
						<Text
							style={{
								fontSize: 16,
								color: "#dc2626",
								fontWeight: 700,
								margin: "0 0 12px",
							}}
						>
							🔒 {t("mail.announcement.securityReminder.title")}
						</Text>
						<ul
							style={{
								margin: 0,
								paddingLeft: 20,
								color: "#374151",
							}}
						>
							<li style={{ marginBottom: 8 }}>
								{t("mail.announcement.securityReminder.point1")}
							</li>
							<li style={{ marginBottom: 8 }}>
								{t("mail.announcement.securityReminder.point2")}
							</li>
							<li style={{ marginBottom: 0 }}>
								{t("mail.announcement.securityReminder.point3")}
							</li>
						</ul>
					</div>
				</Section>
			)}

			{/* 维护时间表（针对维护类公告） */}
			{announcementType === "maintenance" && (
				<Section style={{ marginBottom: 32 }}>
					<div
						style={{
							background: "#fff7ed",
							borderRadius: 12,
							padding: 20,
							border: "1px solid #fed7aa",
						}}
					>
						<Text
							style={{
								fontSize: 16,
								color: "#ea580c",
								fontWeight: 700,
								margin: "0 0 12px",
							}}
						>
							🔧{" "}
							{t("mail.announcement.maintenanceSchedule.title")}
						</Text>
						<Text
							style={{
								fontSize: 14,
								margin: "0 0 16px",
								color: "#9a3412",
							}}
						>
							{t(
								"mail.announcement.maintenanceSchedule.description",
							)}
						</Text>
						<div
							style={{
								background: "#ffffff",
								borderRadius: 8,
								padding: 16,
								border: "1px solid #fed7aa",
							}}
						>
							<Text
								style={{
									fontSize: 14,
									margin: 0,
									color: "#374151",
								}}
							>
								📋{" "}
								{t(
									"mail.announcement.maintenanceSchedule.impact",
								)}
								<br />📞{" "}
								{t(
									"mail.announcement.maintenanceSchedule.support",
								)}
								<br />🔄{" "}
								{t(
									"mail.announcement.maintenanceSchedule.updates",
								)}
							</Text>
						</div>
					</div>
				</Section>
			)}

			{/* 联系支持 */}
			<Section style={{ marginBottom: 32 }}>
				<div
					style={{
						background: "#f8fafc",
						borderRadius: 12,
						padding: 20,
						textAlign: "center",
					}}
				>
					<Text
						style={{
							fontSize: 16,
							fontWeight: 600,
							margin: "0 0 12px",
							color: "#1f2937",
						}}
					>
						💬 {t("mail.announcement.needHelp")}
					</Text>
					<Text
						style={{
							fontSize: 14,
							margin: "0 0 16px",
							color: "#6b7280",
						}}
					>
						{t("mail.announcement.contactSupport")}
					</Text>
					<div>
						<a
							href="mailto:support@hackathonweekly.com"
							style={{
								display: "inline-block",
								background: "#0ea5e9",
								color: "white",
								padding: "10px 20px",
								borderRadius: 6,
								textDecoration: "none",
								fontSize: 14,
								fontWeight: 600,
								marginRight: 8,
							}}
						>
							📧 {t("mail.announcement.emailSupport")}
						</a>
						<a
							href="https://hackathonweekly.com/help"
							style={{
								display: "inline-block",
								background: "#6b7280",
								color: "white",
								padding: "10px 20px",
								borderRadius: 6,
								textDecoration: "none",
								fontSize: 14,
								fontWeight: 600,
							}}
						>
							📚 {t("mail.announcement.helpCenter")}
						</a>
					</div>
				</div>
			</Section>

			{/* 页脚 */}
			<Hr style={{ margin: "32px 0" }} />
			<Section style={{ textAlign: "center" }}>
				<Text
					style={{ fontSize: 14, color: "#666", margin: "0 0 16px" }}
				>
					{t("mail.announcement.footer")}{" "}
					{new Date().toLocaleDateString(
						locale === "zh" ? "zh-CN" : "en-US",
						{
							year: "numeric",
							month: "long",
							day: "numeric",
						},
					)}
				</Text>

				<Text
					style={{ fontSize: 12, color: "#999", margin: "0 0 16px" }}
				>
					{t("mail.announcement.official")}
					<br />
					HackathonWeekly Team
				</Text>

				{/* 不同类型公告的退订说明 */}
				{announcementType === "security" ||
				announcementType === "maintenance" ? (
					<Text style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>
						⚠️ {t("mail.announcement.systemEmailNote")}
					</Text>
				) : (
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
				)}
			</Section>
		</Wrapper>
	);
}
