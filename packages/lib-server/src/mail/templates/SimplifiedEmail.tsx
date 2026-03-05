import Wrapper from "../components/Wrapper";
import { Logo } from "../components/Logo";
import { Text, Hr, Heading, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface SimplifiedEmailProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	title: string;
	content: string;
	senderName: string;
	unsubscribeUrl: string;
}

export function SimplifiedEmail({
	locale,
	translations,
	title,
	content,
	senderName,
	unsubscribeUrl,
}: SimplifiedEmailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	// 将Markdown转换为HTML的简单实现
	const markdownToHtml = (markdown: string) => {
		return markdown
			.replace(
				/^### (.*$)/gim,
				'<h3 style="font-size: 18px; font-weight: 600; margin: 16px 0 8px;">$1</h3>',
			)
			.replace(
				/^## (.*$)/gim,
				'<h2 style="font-size: 20px; font-weight: 600; margin: 20px 0 12px;">$1</h2>',
			)
			.replace(
				/^# (.*$)/gim,
				'<h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 16px;">$1</h1>',
			)
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\*(.*?)\*/g, "<em>$1</em>")
			.replace(
				/\[(.*?)\]\((.*?)\)/g,
				'<a href="$2" style="color: #0ea5e9; text-decoration: underline;">$1</a>',
			)
			.replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
			.replace(/\n/g, "<br />");
	};

	const htmlContent = `<p style="margin: 12px 0;">${markdownToHtml(content)}</p>`;

	return (
		<Wrapper>
			<Section style={{ textAlign: "center", marginBottom: 32 }}>
				<Logo />

				<Heading
					style={{
						fontSize: 28,
						fontWeight: 700,
						margin: "24px 0 8px",
						color: "#1f2937",
						lineHeight: 1.2,
					}}
				>
					{title}
				</Heading>

				<Text style={{ fontSize: 16, color: "#6b7280", margin: 0 }}>
					{t("mail.common.from")} {senderName}
				</Text>
			</Section>

			<Hr style={{ margin: "32px 0" }} />

			{/* 邮件内容 */}
			<Section style={{ marginBottom: 32 }}>
				<div
					style={{
						fontSize: 16,
						lineHeight: 1.6,
						color: "#374151",
						padding: "0 8px",
					}}
					dangerouslySetInnerHTML={{ __html: htmlContent }}
				/>
			</Section>

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
						💬 {t("mail.common.needHelp")}
					</Text>
					<Text
						style={{
							fontSize: 14,
							margin: "0 0 16px",
							color: "#6b7280",
						}}
					>
						{t("mail.common.contactSupport")}
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
							📧 {t("mail.common.emailSupport")}
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
							📚 {t("mail.common.helpCenter")}
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
					{t("mail.common.sentAt")}{" "}
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
					{t("mail.common.official")}
					<br />
					HackathonWeekly Team
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
