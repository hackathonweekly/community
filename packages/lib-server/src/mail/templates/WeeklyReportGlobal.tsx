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

interface WeeklyReportGlobalProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	weekRange: string;
	data: {
		newUsers: number;
		newOrganizations: number;
		totalEvents: number;
		topContributions: Array<{
			id: string;
			userName: string;
			type: string;
			cpValue: number;
			description: string;
		}>;
		featuredProjects: Array<{
			id: string;
			title: string;
			description: string;
			author: string;
			url?: string;
		}>;
		upcomingEvents: Array<{
			id: string;
			title: string;
			startTime: string;
			organizerName: string;
			location?: string;
		}>;
	};
	unsubscribeUrl: string;
}

export function WeeklyReportGlobal({
	locale,
	translations,
	weekRange,
	data,
	unsubscribeUrl,
}: WeeklyReportGlobalProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Section style={{ textAlign: "center", marginBottom: 32 }}>
				<Logo />
				<Heading
					style={{ fontSize: 28, fontWeight: 700, margin: "16px 0" }}
				>
					{t("mail.weeklyReport.global.title")}
				</Heading>
				<Text style={{ fontSize: 16, color: "#666", margin: 0 }}>
					{weekRange} • {t("mail.weeklyReport.global.subtitle")}
				</Text>
			</Section>

			<Hr style={{ margin: "32px 0" }} />

			{/* 社区数据概览 */}
			<Section style={{ marginBottom: 32 }}>
				<Heading
					style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}
				>
					📊 {t("mail.weeklyReport.global.overview")}
				</Heading>

				<Row>
					<Column
						style={{
							width: "33%",
							textAlign: "center",
							padding: "0 8px",
						}}
					>
						<div
							style={{
								background: "#f8fafc",
								borderRadius: 8,
								padding: 16,
							}}
						>
							<Text
								style={{
									fontSize: 24,
									fontWeight: 700,
									color: "#2563eb",
									margin: 0,
								}}
							>
								{data.newUsers}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#666",
									margin: "4px 0 0",
								}}
							>
								{t("mail.weeklyReport.global.newUsers")}
							</Text>
						</div>
					</Column>

					<Column
						style={{
							width: "33%",
							textAlign: "center",
							padding: "0 8px",
						}}
					>
						<div
							style={{
								background: "#f8fafc",
								borderRadius: 8,
								padding: 16,
							}}
						>
							<Text
								style={{
									fontSize: 24,
									fontWeight: 700,
									color: "#059669",
									margin: 0,
								}}
							>
								{data.newOrganizations}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#666",
									margin: "4px 0 0",
								}}
							>
								{t("mail.weeklyReport.global.newOrganizations")}
							</Text>
						</div>
					</Column>

					<Column
						style={{
							width: "33%",
							textAlign: "center",
							padding: "0 8px",
						}}
					>
						<div
							style={{
								background: "#f8fafc",
								borderRadius: 8,
								padding: 16,
							}}
						>
							<Text
								style={{
									fontSize: 24,
									fontWeight: 700,
									color: "#dc2626",
									margin: 0,
								}}
							>
								{data.totalEvents}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#666",
									margin: "4px 0 0",
								}}
							>
								{t("mail.weeklyReport.global.totalEvents")}
							</Text>
						</div>
					</Column>
				</Row>
			</Section>

			<Hr style={{ margin: "32px 0" }} />

			{/* 热门贡献 */}
			{data.topContributions.length > 0 && (
				<Section style={{ marginBottom: 32 }}>
					<Heading
						style={{
							fontSize: 20,
							fontWeight: 600,
							marginBottom: 16,
						}}
					>
						🏆 {t("mail.weeklyReport.global.topContributions")}
					</Heading>

					{data.topContributions
						.slice(0, 3)
						.map((contribution, index) => (
							<div
								key={contribution.id}
								style={{
									background:
										index === 0 ? "#fef3c7" : "#f8fafc",
									borderRadius: 8,
									padding: 16,
									marginBottom: 12,
									border:
										index === 0
											? "2px solid #f59e0b"
											: "1px solid #e2e8f0",
								}}
							>
								<Row>
									<Column
										style={{
											width: "60px",
											textAlign: "center",
										}}
									>
										<div
											style={{
												background:
													index === 0
														? "#f59e0b"
														: "#64748b",
												color: "white",
												borderRadius: "50%",
												width: 40,
												height: 40,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: 16,
												fontWeight: 700,
											}}
										>
											#{index + 1}
										</div>
									</Column>
									<Column>
										<Text
											style={{
												fontSize: 16,
												fontWeight: 600,
												margin: "0 0 4px",
											}}
										>
											{contribution.userName}
										</Text>
										<Text
											style={{
												fontSize: 14,
												color: "#666",
												margin: "0 0 8px",
											}}
										>
											{contribution.type} • +
											{contribution.cpValue}积分
										</Text>
										<Text
											style={{ fontSize: 14, margin: 0 }}
										>
											{contribution.description}
										</Text>
									</Column>
								</Row>
							</div>
						))}
				</Section>
			)}

			<Hr style={{ margin: "32px 0" }} />

			{/* 精选作品 */}
			{data.featuredProjects.length > 0 && (
				<Section style={{ marginBottom: 32 }}>
					<Heading
						style={{
							fontSize: 20,
							fontWeight: 600,
							marginBottom: 16,
						}}
					>
						🚀 {t("mail.weeklyReport.global.featuredProjects")}
					</Heading>

					{data.featuredProjects.slice(0, 2).map((project) => (
						<div
							key={project.id}
							style={{
								background: "#f8fafc",
								borderRadius: 8,
								padding: 16,
								marginBottom: 16,
								border: "1px solid #e2e8f0",
							}}
						>
							<Text
								style={{
									fontSize: 18,
									fontWeight: 600,
									margin: "0 0 8px",
								}}
							>
								{project.title}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#666",
									margin: "0 0 8px",
								}}
							>
								{t("mail.weeklyReport.global.by")}{" "}
								{project.author}
							</Text>
							<Text style={{ fontSize: 14, margin: "0 0 12px" }}>
								{project.description}
							</Text>
							{project.url && (
								<PrimaryButton href={project.url}>
									{t("mail.weeklyReport.global.viewProject")}{" "}
									→
								</PrimaryButton>
							)}
						</div>
					))}
				</Section>
			)}

			<Hr style={{ margin: "32px 0" }} />

			{/* 即将到来的活动 */}
			{data.upcomingEvents.length > 0 && (
				<Section style={{ marginBottom: 32 }}>
					<Heading
						style={{
							fontSize: 20,
							fontWeight: 600,
							marginBottom: 16,
						}}
					>
						📅 {t("mail.weeklyReport.global.upcomingEvents")}
					</Heading>

					{data.upcomingEvents.slice(0, 3).map((event) => (
						<div
							key={event.id}
							style={{
								background: "#f0f9ff",
								borderRadius: 8,
								padding: 16,
								marginBottom: 12,
								border: "1px solid #0ea5e9",
							}}
						>
							<Text
								style={{
									fontSize: 16,
									fontWeight: 600,
									margin: "0 0 4px",
								}}
							>
								{event.title}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#666",
									margin: "0 0 4px",
								}}
							>
								📍{" "}
								{event.location ||
									t("mail.weeklyReport.global.online")}{" "}
								• 🏢 {event.organizerName}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#0ea5e9",
									margin: 0,
								}}
							>
								⏰{" "}
								{new Date(event.startTime).toLocaleDateString(
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
						</div>
					))}
				</Section>
			)}

			{/* 行动号召 */}
			<Section style={{ textAlign: "center", marginBottom: 32 }}>
				<div
					style={{
						background: "#f0f9ff",
						borderRadius: 12,
						padding: 24,
					}}
				>
					<Text
						style={{
							fontSize: 18,
							fontWeight: 600,
							margin: "0 0 12px",
						}}
					>
						💫 {t("mail.weeklyReport.global.cta.title")}
					</Text>
					<Text style={{ fontSize: 16, margin: "0 0 20px" }}>
						{t("mail.weeklyReport.global.cta.description")}
					</Text>
					<PrimaryButton href="https://hackathonweekly.com/">
						{t("mail.weeklyReport.global.cta.button")} →
					</PrimaryButton>
				</div>
			</Section>

			{/* 页脚 */}
			<Hr style={{ margin: "32px 0" }} />
			<Section style={{ textAlign: "center" }}>
				<Text
					style={{ fontSize: 14, color: "#666", margin: "0 0 16px" }}
				>
					{t("mail.weeklyReport.global.footer")}
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
