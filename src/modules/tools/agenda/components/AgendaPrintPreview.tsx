"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Printer } from "lucide-react";
import type { AgendaData } from "./AgendaGenerator";

interface AgendaPrintPreviewProps {
	agendaData: AgendaData;
}

export function AgendaPrintPreview({ agendaData }: AgendaPrintPreviewProps) {
	const generatePrintHTML = () => {
		const styles = `
			@page {
				size: A4;
				margin: 1.2cm;
			}
			body {
				font-family: Arial, "Microsoft YaHei", sans-serif;
				width: 100%;
				max-width: 190mm;
				margin: 0 auto;
				padding: 0 5px;
				font-size: 11.5px;
				line-height: 1.3;
				background: white;
				box-sizing: border-box;
				color: #333;
			}
			.header {
				background-color: #000000;
				color: white;
				padding: 12px;
				margin-bottom: 10px;
				text-align: center;
				page-break-before: avoid;
				position: relative;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.logo {
				position: absolute;
				left: 15px;
				top: 50%;
				transform: translateY(-50%);
				height: 50px;
			}
			.header-content {
				text-align: center;
			}
			h1 {
				font-size: 22px;
				margin: 0;
				padding: 4px 0;
				font-weight: bold;
			}
			h3 {
				font-size: 16px;
				margin: 0;
				padding: 4px 0;
				font-weight: normal;
			}
			.header p {
				margin: 4px 0 0 0;
				font-size: 14px;
				opacity: 0.9;
			}

			.info-section {
				display: flex;
				gap: 10px;
				margin-bottom: 8px;
			}
			.basic-info {
				flex: 2;
				border: 2px solid #000;
				padding: 8px;
				line-height: 1.4;
				background: white;
			}
			.community-intro {
				flex: 1;
				background: #f8f8f8;
				padding: 8px;
				border-left: 4px solid #000000;
				border: 2px solid #ddd;
				border-left: 4px solid #000000;
			}

			.highlights {
				background: linear-gradient(135deg, #fff5f8 0%, #ffe8f0 100%);
				padding: 10px;
				margin: 10px 0;
				border-left: 4px solid #000000;
				border-radius: 0 8px 8px 0;
			}
			.highlights h3 {
				color: #000000;
				margin: 0 0 6px 0;
				font-size: 14px;
				display: flex;
				align-items: center;
				gap: 6px;
			}
			.highlights p {
				margin: 4px 0;
				padding-left: 10px;
				font-size: 11.5px;
				line-height: 1.4;
			}

			table {
				border-collapse: collapse;
				width: 100%;
				margin-bottom: 10px;
				page-break-inside: avoid;
				box-shadow: 0 2px 4px rgba(0,0,0,0.1);
			}
			th, td {
				border: 1px solid #000;
				padding: 6px 8px;
				font-size: 11px;
				vertical-align: top;
				text-align: left;
			}
			th {
				background-color: #000000;
				color: white;
				font-weight: bold;
			}
			.section-title {
				background-color: #000000;
				color: white;
				padding: 6px 10px;
				margin: 8px 0 4px 0;
				font-size: 13px;
				font-weight: bold;
				border-radius: 4px;
			}

			.two-column {
				display: flex;
				gap: 10px;
				margin: 8px 0;
			}
			.two-column > * {
				flex: 1;
			}

			.qr-section {
				text-align: center;
				padding: 15px;
				background: #fafafa;
				border: 1px solid #e0e0e0;
				border-radius: 8px;
				margin: 10px 0;
			}
			.qr-container {
				display: flex;
				justify-content: center;
				gap: 20px;
				flex-wrap: wrap;
				margin-top: 10px;
			}
			.qr-item {
				text-align: center;
				background: white;
				padding: 10px;
				border-radius: 8px;
				border: 1px solid #ddd;
				box-shadow: 0 2px 4px rgba(0,0,0,0.05);
			}
			.qr-item img {
				border: 1px solid #ccc;
				padding: 8px;
				background: white;
				border-radius: 4px;
			}
			.qr-name {
				font-size: 11px;
				font-weight: bold;
				margin: 6px 0 2px 0;
				color: #333;
			}
			.qr-desc {
				font-size: 9px;
				color: #666;
				margin-bottom: 6px;
			}

			.tips-section {
				background: #f0f8ff;
				padding: 10px;
				border-left: 4px solid #2196F3;
				border-radius: 0 8px 8px 0;
			}

			strong {
				color: #000;
			}

			@media print {
				.page-break {
					page-break-before: always;
				}
				body {
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}
				.qr-section {
					page-break-inside: avoid;
				}
				table {
					page-break-inside: avoid;
				}
				.two-column {
					page-break-inside: avoid;
				}
			}

			@media screen {
				body {
					padding: 20px;
					background: #f5f5f5;
				}
				.print-container {
					background: white;
					box-shadow: 0 4px 12px rgba(0,0,0,0.15);
					border-radius: 8px;
					overflow: hidden;
				}
			}
		`;

		const scheduleRows = agendaData.schedule
			.map(
				(item) => `
				<tr>
					<td width="18%">${item.timeRange}</td>
					<td width="47%">${item.content}</td>
					<td width="15%">${item.duration}</td>
					<td width="20%">${item.responsible}</td>
				</tr>
			`,
			)
			.join("");

		const roleRows = agendaData.roles
			.filter((role) => role.role || role.person)
			.map(
				(role) => `
				<tr>
					<td width="40%">${role.role}</td>
					<td width="60%">${role.person}</td>
				</tr>
			`,
			)
			.join("");

		// Generate QR Codes section
		const qrCodesSection =
			agendaData.qrCodes.filter(
				(qr) => qr.name && (qr.url || qr.imagePath),
			).length > 0
				? `
			<div class="qr-section">
				<h3 class="section-title">📱 扫码了解更多</h3>
				<div class="qr-container">
					${agendaData.qrCodes
						.filter((qr) => qr.name && (qr.url || qr.imagePath))
						.map((qr) => {
							if (qr.imagePath) {
								return `
								<div class="qr-item">
									<div class="qr-name">${qr.name}</div>
									<div class="qr-desc">${qr.description}</div>
									<img src="${qr.imagePath}" alt="${qr.name}" style="width: 100px; height: 100px;">
								</div>
							`;
							}
							if (qr.url) {
								return `
								<div class="qr-item">
									<div class="qr-name">${qr.name}</div>
									<div class="qr-desc">${qr.description}</div>
									<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qr.url)}" alt="${qr.name}" style="width: 100px; height: 100px;">
								</div>
							`;
							}
							return "";
						})
						.join("")}
				</div>
			</div>
		`
				: "";

		const communityIntroSection = agendaData.basicInfo.communityIntro
			? `
		<div class="community-intro">
			<strong>社区介绍：</strong><br>
			${agendaData.basicInfo.communityIntro.replace(/\n/g, "<br>")}
		</div>
		`
			: `
		<div class="community-intro">
			<strong>社区介绍：</strong><br>
			HackathonWeekly周周黑客松是一个AI 产品创造者社区，每周末，一起创造有趣的 AI 产品！
		</div>
		`;

		return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${agendaData.basicInfo.title} - 活动议程</title>
    <style>${styles}</style>
</head>
<body>
    <div class="print-container">
        <div class="header">
            <img src="/images/logo-white.png" alt="Logo" class="logo">
            <div class="header-content">
                <h1>${agendaData.basicInfo.title}</h1>
                <h3>${agendaData.basicInfo.subtitle}</h3>
                <p>让创造成为一种生活方式</p>
            </div>
        </div>

        <div class="info-section">
            <div class="basic-info">
                <p><strong>⏰ 时间：</strong>${agendaData.basicInfo.date} ${agendaData.basicInfo.time}</p>
                <p><strong>📍 地点：</strong>${agendaData.basicInfo.location}</p>
                ${agendaData.basicInfo.sponsor ? `<p><strong>💰 赞助方：</strong>${agendaData.basicInfo.sponsor}</p>` : ""}
                ${agendaData.basicInfo.partners ? `<p><strong>🤝 合作伙伴：</strong>${agendaData.basicInfo.partners}</p>` : ""}
            </div>
            ${communityIntroSection}
        </div>

        ${
			agendaData.highlights
				? `
        <div class="highlights">
            <h3>💝 活动亮点</h3>
            <p>${agendaData.highlights.replace(/\n/g, "<br>")}</p>
        </div>
        `
				: ""
		}

        <table>
            <tr>
                <th width="18%">⏰ 时间</th>
                <th width="47%">📋 活动内容</th>
                <th width="15%">⏱️ 时长/m</th>
                <th width="20%">👤 负责人</th>
            </tr>
            ${scheduleRows}
        </table>

        <div class="two-column">
            <div>
                <h3 class="section-title">👥 活动角色</h3>
                <table>
                    <tr>
                        <th width="40%">角色</th>
                        <th width="60%">负责人</th>
                    </tr>
                    ${roleRows}
                </table>
            </div>
            <div>
                <h3 class="section-title">⏰ 时间规则说明</h3>
                <p style="margin-bottom: 10px; font-size: 11px;">${agendaData.timeRules.description}</p>
                <table>
                    <tr>
                        <th width="35%">环节</th>
                        <th width="35%">提醒</th>
                        <th width="30%">响铃</th>
                    </tr>
                    ${agendaData.timeRules.rules
						.map(
							(rule) => `
                    <tr>
                        <td>${rule.duration}</td>
                        <td>${rule.reminder}</td>
                        <td>${rule.bell}</td>
                    </tr>
                    `,
						)
						.join("")}
                </table>
            </div>
        </div>

        ${qrCodesSection}

        ${
			agendaData.tips
				? `
        <div class="tips-section">
            <h3 class="section-title">💌 温馨小贴士</h3>
            <p style="margin: 0; font-size: 11px;">${agendaData.tips.replace(/\n/g, "<br>")}</p>
        </div>
        `
				: ""
		}
    </div>

    <script>
        // 自动触发打印对话框
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;
	};

	const openPrintPreview = () => {
		const htmlContent = generatePrintHTML();
		const newWindow = window.open(
			"",
			"_blank",
			"width=800,height=1000,scrollbars=yes,resizable=yes",
		);

		if (newWindow) {
			newWindow.document.write(htmlContent);
			newWindow.document.close();
		}
	};

	return (
		<Card className="border-2 border-purple-200 bg-purple-50/50">
			<CardHeader className="text-center">
				<CardTitle className="text-xl text-purple-900">
					打印预览
				</CardTitle>
				<CardDescription className="text-purple-700">
					在新窗口中预览并打印活动议程
				</CardDescription>
			</CardHeader>
			<CardContent className="text-center">
				<Button
					onClick={openPrintPreview}
					size="lg"
					className="w-full max-w-md h-12 text-lg font-semibold bg-purple-600 hover:bg-purple-700"
				>
					<Printer className="mr-2 h-5 w-5" />
					预览并打印
				</Button>
			</CardContent>
		</Card>
	);
}
