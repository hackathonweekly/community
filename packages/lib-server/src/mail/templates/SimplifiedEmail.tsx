import Wrapper from "../components/Wrapper";
import { Text, Hr, Heading, Section } from "@react-email/components";
import { createTranslator } from "use-intl/core";

interface SimplifiedEmailProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	title: string;
	content: string;
	senderName: string;
	unsubscribeUrl: string;
	imageUrl?: string;
	eventTitle?: string;
	eventUrl?: string;
	organizerEmail?: string;
}

export function SimplifiedEmail({
	locale,
	translations,
	title,
	content,
	senderName,
	unsubscribeUrl,
	imageUrl,
	eventTitle,
	eventUrl,
	organizerEmail,
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
				/!\[(.*?)\]\((.*?)\)/g,
				'<img src="$2" alt="$1" style="display: block; max-width: 100%; border-radius: 12px; margin: 16px 0;" />',
			)
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
			{/* 简洁的头部 */}
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
					{title}
				</Heading>

				<Text style={{ fontSize: 13, color: "#999", margin: 0 }}>
					{t("mail.common.from")} {senderName}
				</Text>
			</Section>

			<Hr style={{ borderColor: "#e5e5e5", margin: "20px 0" }} />

			{/* 邮件内容 - 主体 */}
			<Section style={{ marginBottom: 24 }}>
				{imageUrl && (
					<div style={{ marginBottom: 20 }}>
						<img
							src={imageUrl}
							alt="notification-image"
							style={{
								width: "100%",
								maxHeight: 320,
								objectFit: "cover",
								borderRadius: 8,
								border: "1px solid #e5e5e5",
							}}
						/>
					</div>
				)}

				<div
					style={{
						fontSize: 15,
						lineHeight: 1.7,
						color: "#333",
					}}
					dangerouslySetInnerHTML={{ __html: htmlContent }}
				/>
			</Section>

			{/* 活动信息 */}
			{eventTitle && eventUrl && (
				<Section style={{ marginBottom: 24 }}>
					<Text
						style={{
							fontSize: 13,
							color: "#666",
							margin: "0 0 8px",
						}}
					>
						此通知来自活动：
						<a
							href={eventUrl}
							style={{
								color: "#000",
								textDecoration: "underline",
								fontWeight: 500,
								marginLeft: 4,
							}}
						>
							{eventTitle}
						</a>
					</Text>
					{organizerEmail && (
						<Text
							style={{
								fontSize: 13,
								color: "#666",
								margin: 0,
							}}
						>
							如有疑问，请联系组织者：
							<a
								href={`mailto:${organizerEmail}`}
								style={{
									color: "#000",
									textDecoration: "underline",
									marginLeft: 4,
								}}
							>
								{organizerEmail}
							</a>
						</Text>
					)}
				</Section>
			)}

			{/* 页脚 */}
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
						取消订阅
					</a>
				</Text>
			</Section>
		</Wrapper>
	);
}
