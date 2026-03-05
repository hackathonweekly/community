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

interface WeeklyReportOrganizationProps {
	locale: "en" | "zh";
	translations: Record<string, any>;
	weekRange: string;
	organizationName: string;
	organizationLogo?: string;
	data: {
		organizationId: string;
		organizationSlug?: string;
		newMembers: number;
		organizationEvents: Array<{
			id: string;
			title: string;
			startTime: string;
			attendeeCount: number;
			status: string;
		}>;
		memberContributions: Array<{
			id: string;
			userName: string;
			type: string;
			cpValue: number;
			description: string;
		}>;
		organizationProjects: Array<{
			id: string;
			title: string;
			description: string;
			author: string;
			stage: string;
		}>;
		memberHighlights: Array<{
			id: string;
			name: string;
			achievement: string;
			cpValue: number;
		}>;
	};
	unsubscribeUrl: string;
}

export function WeeklyReportOrganization({
	locale,
	translations,
	weekRange,
	organizationName,
	organizationLogo,
	data,
	unsubscribeUrl,
}: WeeklyReportOrganizationProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

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
				<Heading
					style={{ fontSize: 28, fontWeight: 700, margin: "16px 0" }}
				>
					{organizationName}{" "}
					{t("mail.weeklyReport.organization.title")}
				</Heading>
				<Text style={{ fontSize: 16, color: "#666", margin: 0 }}>
					{weekRange} • {t("mail.weeklyReport.organization.subtitle")}
				</Text>
			</Section>

			<Hr style={{ margin: "32px 0" }} />

			{/* 组织数据概览 */}
			<Section style={{ marginBottom: 32 }}>
				<Heading
					style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}
				>
					📊 {t("mail.weeklyReport.organization.overview")}
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
								background: "#f0fdf4",
								borderRadius: 8,
								padding: 16,
							}}
						>
							<Text
								style={{
									fontSize: 24,
									fontWeight: 700,
									color: "#16a34a",
									margin: 0,
								}}
							>
								{data.newMembers}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#666",
									margin: "4px 0 0",
								}}
							>
								{t("mail.weeklyReport.organization.newMembers")}
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
								background: "#fef3c7",
								borderRadius: 8,
								padding: 16,
							}}
						>
							<Text
								style={{
									fontSize: 24,
									fontWeight: 700,
									color: "#d97706",
									margin: 0,
								}}
							>
								{data.organizationEvents.length}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#666",
									margin: "4px 0 0",
								}}
							>
								{t("mail.weeklyReport.organization.events")}
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
								background: "#fdf2f8",
								borderRadius: 8,
								padding: 16,
							}}
						>
							<Text
								style={{
									fontSize: 24,
									fontWeight: 700,
									color: "#be185d",
									margin: 0,
								}}
							>
								{data.memberContributions.reduce(
									(sum, c) => sum + c.cpValue,
									0,
								)}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#666",
									margin: "4px 0 0",
								}}
							>
								{t("mail.weeklyReport.organization.totalCP")}
							</Text>
						</div>
					</Column>
				</Row>
			</Section>

			<Hr style={{ margin: "32px 0" }} />

			{/* 成员亮点 */}
			{data.memberHighlights.length > 0 && (
				<Section style={{ marginBottom: 32 }}>
					<Heading
						style={{
							fontSize: 20,
							fontWeight: 600,
							marginBottom: 16,
						}}
					>
						⭐{" "}
						{t("mail.weeklyReport.organization.memberHighlights")}
					</Heading>

					{data.memberHighlights
						.slice(0, 3)
						.map((highlight, index) => (
							<div
								key={highlight.id}
								style={{
									background: "#f8fafc",
									borderRadius: 8,
									padding: 16,
									marginBottom: 12,
									border: "1px solid #e2e8f0",
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
														: index === 1
															? "#6b7280"
															: "#84cc16",
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
											🏆
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
											{highlight.name}
										</Text>
										<Text
											style={{
												fontSize: 14,
												color: "#666",
												margin: "0 0 4px",
											}}
										>
											{highlight.achievement}
										</Text>
										<Text
											style={{
												fontSize: 14,
												color: "#16a34a",
												fontWeight: 600,
												margin: 0,
											}}
										>
											+{highlight.cpValue}积分
										</Text>
									</Column>
								</Row>
							</div>
						))}
				</Section>
			)}

			<Hr style={{ margin: "32px 0" }} />

			{/* 组织活动回顾 */}
			{data.organizationEvents.length > 0 && (
				<Section style={{ marginBottom: 32 }}>
					<Heading
						style={{
							fontSize: 20,
							fontWeight: 600,
							marginBottom: 16,
						}}
					>
						📅 {t("mail.weeklyReport.organization.eventReview")}
					</Heading>

					{data.organizationEvents.slice(0, 3).map((event) => (
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
								⏰{" "}
								{new Date(event.startTime).toLocaleDateString(
									locale === "zh" ? "zh-CN" : "en-US",
									{
										month: "short",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									},
								)}
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "#0ea5e9",
									margin: 0,
								}}
							>
								👥 {event.attendeeCount}{" "}
								{t("mail.weeklyReport.organization.attendees")}{" "}
								• 📊{" "}
								{t(
									`mail.weeklyReport.organization.status.${event.status.toLowerCase()}`,
								)}
							</Text>
						</div>
					))}
				</Section>
			)}

			<Hr style={{ margin: "32px 0" }} />

			{/* 作品进展 */}
			{data.organizationProjects.length > 0 && (
				<Section style={{ marginBottom: 32 }}>
					<Heading
						style={{
							fontSize: 20,
							fontWeight: 600,
							marginBottom: 16,
						}}
					>
						🚀 {t("mail.weeklyReport.organization.projectProgress")}
					</Heading>

					{data.organizationProjects.slice(0, 2).map((project) => (
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
									fontSize: 16,
									fontWeight: 600,
									margin: "0 0 4px",
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
								{t("mail.weeklyReport.organization.by")}{" "}
								{project.author}
							</Text>
							<Text style={{ fontSize: 14, margin: "0 0 8px" }}>
								{project.description}
							</Text>
							<div
								style={{
									display: "inline-block",
									background: "#e0f2fe",
									color: "#0369a1",
									padding: "4px 8px",
									borderRadius: 4,
									fontSize: 12,
									fontWeight: 600,
								}}
							>
								{t(
									`mail.weeklyReport.organization.projectStage.${project.stage.toLowerCase()}`,
								)}
							</div>
						</div>
					))}
				</Section>
			)}

			{/* 成员贡献排行 */}
			{data.memberContributions.length > 0 && (
				<Section style={{ marginBottom: 32 }}>
					<Heading
						style={{
							fontSize: 20,
							fontWeight: 600,
							marginBottom: 16,
						}}
					>
						🎯{" "}
						{t(
							"mail.weeklyReport.organization.memberContributions",
						)}
					</Heading>

					{data.memberContributions
						.slice(0, 5)
						.map((contribution, index) => (
							<div
								key={contribution.id}
								style={{
									background:
										index < 3 ? "#fef3c7" : "#f8fafc",
									borderRadius: 8,
									padding: 12,
									marginBottom: 8,
									border:
										index < 3
											? "1px solid #f59e0b"
											: "1px solid #e2e8f0",
								}}
							>
								<Row>
									<Column style={{ width: "40px" }}>
										<Text
											style={{
												fontSize: 14,
												fontWeight: 700,
												color:
													index < 3
														? "#d97706"
														: "#64748b",
												margin: 0,
											}}
										>
											#{index + 1}
										</Text>
									</Column>
									<Column>
										<Text
											style={{
												fontSize: 14,
												fontWeight: 600,
												margin: 0,
											}}
										>
											{contribution.userName} •{" "}
											{contribution.type}
										</Text>
										<Text
											style={{
												fontSize: 12,
												color: "#666",
												margin: 0,
											}}
										>
											+{contribution.cpValue}积分
										</Text>
									</Column>
								</Row>
							</div>
						))}
				</Section>
			)}

			{/* 行动号召 */}
			<Section style={{ textAlign: "center", marginBottom: 32 }}>
				<div
					style={{
						background: "#f0fdf4",
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
						🌟 {t("mail.weeklyReport.organization.cta.title")}
					</Text>
					<Text style={{ fontSize: 16, margin: "0 0 20px" }}>
						{t("mail.weeklyReport.organization.cta.description")}
					</Text>
					<PrimaryButton
						href={`https://hackathonweekly.com/orgs/${data.organizationSlug ?? data.organizationId}/manage`}
					>
						{t("mail.weeklyReport.organization.cta.button")} →
					</PrimaryButton>
				</div>
			</Section>

			{/* 页脚 */}
			<Hr style={{ margin: "32px 0" }} />
			<Section style={{ textAlign: "center" }}>
				<Text
					style={{ fontSize: 14, color: "#666", margin: "0 0 16px" }}
				>
					{t("mail.weeklyReport.organization.footer", {
						organizationName,
					})}
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
