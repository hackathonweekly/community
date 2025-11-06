"use client";

import { useEffect, useRef } from "react";
import type { AgendaData } from "./AgendaGenerator";

interface AgendaPreviewProps {
	data: AgendaData;
}

export function AgendaPreview({ data }: AgendaPreviewProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const generateHTML = () => {
		const styles = `
			@page {
				size: A4;
				margin: 1.2cm;
			}
			body {
				font-family: Arial, sans-serif;
				max-width: 210mm;
				margin: 0 auto;
				padding: 0 10px;
				font-size: 11.5px;
				line-height: 1.3;
				background: white;
			}
			.header {
				background-color: #000000;
				color: white;
				padding: 10px;
				margin-bottom: 8px;
				text-align: center;
				page-break-before: avoid;
				position: relative;
			}
			.logo {
				position: absolute;
				left: 10px;
				top: 50%;
				transform: translateY(-50%);
				height: 45px;
			}
			h1 { font-size: 20px; margin: 0; padding: 3px 0; }
			h3 { font-size: 15px; margin: 0; padding: 3px 0; }
			p { margin: 3px 0; }

			.info-section {
				display: flex;
				gap: 8px;
				margin-bottom: 6px;
			}
			.basic-info {
				flex: 2;
				border: 1px solid #000;
				padding: 6px;
				line-height: 1.3;
			}
			.community-intro {
				flex: 1;
				background: #f8f8f8;
				padding: 6px;
				border-left: 3px solid #000000;
			}

			.highlights {
				background: #fff1f8;
				padding: 6px;
				margin: 6px 0;
				border-left: 3px solid #000000;
			}
			.highlights h3 {
				color: #000000;
				margin: 0 0 4px 0;
				font-size: 12px;
			}
			.highlights p {
				margin: 3px 0;
				padding-left: 8px;
				font-size: 11px;
			}

			table {
				border-collapse: collapse;
				width: 100%;
				margin-bottom: 8px;
				page-break-inside: avoid;
			}
			th, td {
				border: 1px solid #000;
				padding: 4px 5px;
				font-size: 11px;
				vertical-align: top;
			}
			.section {
				background-color: #000000;
				color: white;
			}
			.section-title {
				background-color: #000000;
				color: white;
				padding: 4px 6px;
				margin: 6px 0 3px 0;
				font-size: 12px;
			}

			.two-column {
				display: flex;
				gap: 8px;
				margin: 6px 0;
			}
			.two-column > * {
				flex: 1;
			}

			@media print {
				.page-break {
					page-break-before: always;
				}
				body {
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}
			}
		`;

		const scheduleRows = data.schedule
			.map(
				(item) => `
			<tr>
				<td>${item.timeRange}</td>
				<td>${item.content}</td>
				<td>${item.duration}</td>
				<td>${item.responsible}</td>
			</tr>
		`,
			)
			.join("");

		const roleRows = data.roles
			.filter((role) => role.role || role.person) // 过滤掉空的角色
			.map(
				(role) => `
			<tr>
				<td>${role.role}</td>
				<td>${role.person}</td>
			</tr>
		`,
			)
			.join("");

		// Generate QR Codes section
		const qrCodesSection =
			data.qrCodes.filter((qr) => qr.name && (qr.url || qr.imagePath)) // 显示有名称且有链接或图片的二维码
				.length > 0
				? `
    <div class="two-column">
        <div>
            <h3 class="section-title">📱 扫码了解更多</h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                ${data.qrCodes
					.filter((qr) => qr.name && (qr.url || qr.imagePath))
					.map((qr, index) => {
						if (qr.imagePath) {
							return `
                    <div style="text-align: center; margin-bottom: 10px;">
                        <div style="font-size: 10px; margin-bottom: 4px; font-weight: bold;">${qr.name}</div>
                        <div style="font-size: 8px; color: #666; margin-bottom: 4px;">${qr.description}</div>
                        <div style="border: 1px solid #ddd; padding: 8px; border-radius: 4px; background: white; display: inline-block;">
                            <img src="${qr.imagePath}" alt="${qr.name}" style="width: 80px; height: 80px;">
                        </div>
                    </div>
                `;
						}
						if (qr.url) {
							return `
                    <div style="text-align: center; margin-bottom: 10px;">
                        <div style="font-size: 10px; margin-bottom: 4px; font-weight: bold;">${qr.name}</div>
                        <div style="font-size: 8px; color: #666; margin-bottom: 4px;">${qr.description}</div>
                        <div style="border: 1px solid #ddd; padding: 8px; border-radius: 4px; background: white; display: inline-block;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qr.url)}" alt="${qr.name}" style="width: 80px; height: 80px;">
                        </div>
                    </div>
                `;
						}
						return "";
					})
					.join("")}
            </div>
        </div>
    </div>
    `
				: "";

		// Generate Community Intro section
		const communityIntroSection = data.basicInfo.communityIntro
			? `
    <div class="community-intro">
        <strong>社区介绍：</strong><br>
        ${data.basicInfo.communityIntro.replace(/\n/g, "<br>")}
    </div>
    `
			: `
    <div class="community-intro">
        <strong>社区介绍：</strong><br>
        HackathonWeekly周周黑客松是一个AI 产品创造者社区，每周末，一起创造有趣的 AI 产品！
    </div>
    `;

		return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${data.basicInfo.title}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="header">
        <img src="/images/logo-white.png" alt="Logo" class="logo">
        <div>
            <h1>${data.basicInfo.title}</h1>
            <h3>${data.basicInfo.subtitle}</h3>
            <p>让创造成为一种生活方式</p>
        </div>
    </div>

    <div class="info-section">
        <div class="basic-info">
            <strong>时间：</strong>${data.basicInfo.date} ${data.basicInfo.time}<br>
            <strong>地点：</strong>${data.basicInfo.location}<br>
            ${data.basicInfo.sponsor ? `<strong>赞助方：</strong>${data.basicInfo.sponsor}<br>` : ""}
            ${data.basicInfo.partners ? `<strong>合作伙伴：</strong>${data.basicInfo.partners}` : ""}
        </div>
        ${communityIntroSection}
    </div>

    ${
		data.highlights
			? `
    <div class="highlights">
        <h3>💝 活动亮点</h3>
        <p>${data.highlights.replace(/\n/g, "<br>")}</p>
    </div>
    `
			: ""
	}

    <table>
        <tr class="section">
            <th width="20%">时间</th>
            <th width="45%">活动内容</th>
            <th width="15%">时长/m</th>
            <th width="20%">负责人</th>
        </tr>
        ${scheduleRows}
    </table>

    <div class="two-column">
        <div>
            <h3 class="section-title">活动角色</h3>
            <table>
                <tr>
                    <th>角色</th>
                    <th>负责人</th>
                </tr>
                ${roleRows}
            </table>
        </div>
        <div>
            <h3 class="section-title">时间规则说明</h3>
            <p style="margin-bottom: 10px;">${data.timeRules.description}</p>
            <table>
                <tr>
                    <th>环节</th>
                    <th>提醒</th>
                    <th>响铃</th>
                    <th>超时响铃</th>
                </tr>
                ${data.timeRules.rules
					.map(
						(rule) => `
                <tr>
                    <td>${rule.duration}</td>
                    <td>${rule.reminder}</td>
                    <td>${rule.bell}</td>
                    <td>${rule.overtime}</td>
                </tr>
                `,
					)
					.join("")}
            </table>
        </div>
    </div>

    ${qrCodesSection}

    ${
		data.tips
			? `
    <div class="two-column">
        <div>
            <h3 class="section-title">💌 温馨小贴士</h3>
            <table>
                <tr>
                    <td>${data.tips.replace(/\n/g, "<br>")}</td>
                </tr>
            </table>
        </div>
    </div>
    `
			: ""
	}

</body>
</html>`;
	};

	useEffect(() => {
		if (iframeRef.current) {
			const iframe = iframeRef.current;
			const iframeDoc =
				iframe.contentDocument || iframe.contentWindow?.document;

			if (iframeDoc) {
				iframeDoc.open();
				iframeDoc.write(generateHTML());
				iframeDoc.close();
			}
		}
	}, [data]);

	return (
		<div className="space-y-4">
			<div className="border rounded-lg overflow-hidden bg-white">
				<iframe
					ref={iframeRef}
					className="w-full h-[800px] border-0"
					title="Agenda Preview"
					sandbox="allow-same-origin"
				/>
			</div>
			<div className="text-sm text-muted-foreground text-center">
				预览窗口显示实际打印效果，使用下载按钮生成HTML文件后在浏览器中打开进行打印
			</div>
		</div>
	);
}
