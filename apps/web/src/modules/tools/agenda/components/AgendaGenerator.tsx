"use client";

import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { Textarea } from "@community/ui/ui/textarea";
import {
	Download,
	ExternalLink,
	Eye,
	Plus,
	QrCode,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { AgendaPreview } from "./AgendaPreview";
import { AgendaPrintPreview } from "./AgendaPrintPreview";

export interface AgendaData {
	basicInfo: {
		title: string;
		subtitle: string;
		date: string;
		time: string;
		location: string;
		organizer: string;
		sponsor: string;
		partners: string;
		communityIntro: string;
	};
	schedule: Array<{
		timeRange: string;
		content: string;
		duration: string;
		responsible: string;
	}>;
	roles: Array<{
		role: string;
		person: string;
	}>;
	highlights: string;
	tips: string;
	qrCodes: Array<{
		name: string;
		url: string;
		description: string;
		imagePath?: string;
	}>;
	timeRules: {
		enabled: boolean;
		description: string;
		rules: Array<{
			duration: string;
			reminder: string;
			bell: string;
			overtime: string;
		}>;
	};
	communityInfo: {
		description: string;
		tagline: string;
	};
}

const initialAgendaData: AgendaData = {
	basicInfo: {
		title: "周周黑客松",
		subtitle: "活动主题 | 一起创造精彩",
		date: "",
		time: "",
		location: "",
		organizer: "HackathonWeekly",
		sponsor: "",
		partners: "",
		communityIntro:
			"HackathonWeekly周周黑客松是一个AI 产品创造者社区，每周末，一起创造有趣的 AI 产品！",
	},
	schedule: [
		{
			timeRange: "13:00-14:00",
			content: "签到、自由交流",
			duration: "60",
			responsible: "",
		},
		{
			timeRange: "14:00-14:05",
			content: "温暖开场",
			duration: "5",
			responsible: "",
		},
	],
	roles: [
		{
			role: "活动主理人",
			person: "",
		},
		{
			role: "主持人",
			person: "",
		},
		{
			role: "签到接待组",
			person: "",
		},
		{
			role: "技术支持组",
			person: "",
		},
		{
			role: "记录摄影组",
			person: "",
		},
	],
	highlights: "",
	tips: "1. 用友善的态度交流，互相鼓励和支持～\n2. 准时参与，一起享受创作的快乐\n3. 记得拍照记录，分享你的创意时刻",
	qrCodes: [
		{
			name: "社区公众号",
			url: "",
			description: "关注 HackathonWeekly 公众号",
			imagePath: "/images/wechat_official_qr.jpg",
		},
		{
			name: "社区小程序",
			url: "",
			description: "使用 HackathonWeekly 小程序",
			imagePath: "/images/wechat_mini.jpg",
		},
		{
			name: "活动文档",
			url: "",
			description: "活动相关文档和资料",
		},
	],
	timeRules: {
		enabled: true,
		description:
			"我们会在每个环节时间快到的时候举牌提醒，结束时响铃，如果发言人超时，希望大家通过鼓掌的方式让环节结束。",
		rules: [
			{
				duration: "所有环节",
				reminder: "剩余2分钟举牌",
				bell: "时间到响铃",
				overtime: "超时30秒响铃",
			},
		],
	},
	communityInfo: {
		description:
			"HackathonWeekly周周黑客松是一个AI 产品创造者社区，每周末，一起创造有趣的 AI 产品！",
		tagline: "让创造成为一种生活方式",
	},
};

export function AgendaGenerator() {
	const [agendaData, setAgendaData] = useState<AgendaData>(initialAgendaData);
	const [activeTab, setActiveTab] = useState("edit");

	const updateBasicInfo = (
		field: keyof AgendaData["basicInfo"],
		value: string,
	) => {
		setAgendaData((prev) => ({
			...prev,
			basicInfo: {
				...prev.basicInfo,
				[field]: value,
			},
		}));
	};

	// QR Code management functions
	const addQRCode = () => {
		setAgendaData((prev) => ({
			...prev,
			qrCodes: [
				...prev.qrCodes,
				{
					name: "",
					url: "",
					description: "",
				},
			],
		}));
	};

	const removeQRCode = (index: number) => {
		setAgendaData((prev) => ({
			...prev,
			qrCodes: prev.qrCodes.filter((_, i) => i !== index),
		}));
	};

	const updateQRCode = (
		index: number,
		field: keyof AgendaData["qrCodes"][0],
		value: string,
	) => {
		setAgendaData((prev) => ({
			...prev,
			qrCodes: prev.qrCodes.map((item, i) =>
				i === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	// Community info management
	const updateCommunityInfo = (
		field: keyof AgendaData["communityInfo"],
		value: string,
	) => {
		setAgendaData((prev) => ({
			...prev,
			communityInfo: {
				...prev.communityInfo,
				[field]: value,
			},
		}));
	};

	// Time rules management
	const updateTimeRules = (enabled: boolean) => {
		setAgendaData((prev) => ({
			...prev,
			timeRules: {
				...prev.timeRules,
				enabled,
			},
		}));
	};

	const updateTimeRule = (
		index: number,
		field: keyof AgendaData["timeRules"]["rules"][0],
		value: string,
	) => {
		setAgendaData((prev) => ({
			...prev,
			timeRules: {
				...prev.timeRules,
				rules: prev.timeRules.rules.map((item, i) =>
					i === index ? { ...item, [field]: value } : item,
				),
			},
		}));
	};

	const addScheduleItem = () => {
		setAgendaData((prev) => ({
			...prev,
			schedule: [
				...prev.schedule,
				{
					timeRange: "",
					content: "",
					duration: "",
					responsible: "",
				},
			],
		}));
	};

	const removeScheduleItem = (index: number) => {
		setAgendaData((prev) => ({
			...prev,
			schedule: prev.schedule.filter((_, i) => i !== index),
		}));
	};

	const updateScheduleItem = (
		index: number,
		field: string,
		value: string,
	) => {
		setAgendaData((prev) => ({
			...prev,
			schedule: prev.schedule.map((item, i) =>
				i === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	const downloadHTML = () => {
		const htmlContent = generateAgendaHTML();
		const blob = new Blob([htmlContent], {
			type: "text/html;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `agenda-${Date.now()}.html`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const generateAgendaHTML = () => {
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

		const scheduleRows = agendaData.schedule
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

		const roleRows = agendaData.roles
			.map(
				(role) => `
			<tr>
				<td>${role.role}</td>
				<td>${role.person}</td>
			</tr>
		`,
			)
			.join("");

		return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${agendaData.basicInfo.title}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="header">
        <img src="https://hackathonweekly.com/logo-white.png" alt="Logo" class="logo">
        <div>
            <h1>${agendaData.basicInfo.title}</h1>
            <h3>${agendaData.basicInfo.subtitle}</h3>
            <p>让创造成为一种生活方式</p>
        </div>
    </div>

    <div class="info-section">
        <div class="basic-info">
            <strong>时间：</strong>${agendaData.basicInfo.date} ${agendaData.basicInfo.time}<br>
            <strong>地点：</strong>${agendaData.basicInfo.location}<br>
            ${agendaData.basicInfo.sponsor ? `<strong>赞助方：</strong>${agendaData.basicInfo.sponsor}<br>` : ""}
            ${agendaData.basicInfo.partners ? `<strong>合作伙伴：</strong>${agendaData.basicInfo.partners}` : ""}
        </div>
        <div class="community-intro">
            <strong>社区介绍：</strong><br>
            HackathonWeekly周周黑客松是一个AI 产品创造者社区，每周末，一起创造有趣的 AI 产品！
        </div>
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
            <p style="margin-bottom: 10px;">${agendaData.timeRules.description}</p>
            <table>
                <tr>
                    <th>环节</th>
                    <th>提醒</th>
                    <th>响铃</th>
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

    ${
		agendaData.qrCodes &&
		agendaData.qrCodes.filter((qr) => qr.name && (qr.url || qr.imagePath))
			.length > 0
			? `
    <div class="two-column">
        <div>
            <h3 class="section-title">📱 扫码了解更多</h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                ${agendaData.qrCodes
					.filter((qr) => qr.name && (qr.url || qr.imagePath))
					.map((qr) => {
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
			: ""
	}

    ${
		agendaData.tips
			? `
    <div class="two-column">
        <div>
            <h3 class="section-title">💌 温馨小贴士</h3>
            <table>
                <tr>
                    <td>${agendaData.tips.replace(/\n/g, "<br>")}</td>
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

	return (
		<div className="space-y-6">
			{/* Print Preview Section - Always Visible */}
			<AgendaPrintPreview agendaData={agendaData} />

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger
						value="edit"
						className="flex items-center gap-2"
					>
						编辑
					</TabsTrigger>
					<TabsTrigger
						value="preview"
						className="flex items-center gap-2"
					>
						<Eye className="h-4 w-4" />
						预览
					</TabsTrigger>
				</TabsList>

				<TabsContent value="edit" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Basic Information */}
						<Card>
							<CardHeader>
								<CardTitle>基本信息</CardTitle>
								<CardDescription>
									设置活动的基本信息
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="title">活动标题</Label>
										<Input
											id="title"
											value={agendaData.basicInfo.title}
											onChange={(e) =>
												updateBasicInfo(
													"title",
													e.target.value,
												)
											}
										/>
									</div>
									<div>
										<Label htmlFor="subtitle">
											活动副标题
										</Label>
										<Input
											id="subtitle"
											value={
												agendaData.basicInfo.subtitle
											}
											onChange={(e) =>
												updateBasicInfo(
													"subtitle",
													e.target.value,
												)
											}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="date">活动日期</Label>
										<Input
											id="date"
											value={agendaData.basicInfo.date}
											onChange={(e) =>
												updateBasicInfo(
													"date",
													e.target.value,
												)
											}
											placeholder="2024年11月23日（周六）"
										/>
									</div>
									<div>
										<Label htmlFor="time">活动时间</Label>
										<Input
											id="time"
											value={agendaData.basicInfo.time}
											onChange={(e) =>
												updateBasicInfo(
													"time",
													e.target.value,
												)
											}
											placeholder="13:00-18:00"
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="location">活动地点</Label>
									<Input
										id="location"
										value={agendaData.basicInfo.location}
										onChange={(e) =>
											updateBasicInfo(
												"location",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="sponsor">赞助方</Label>
										<Input
											id="sponsor"
											value={agendaData.basicInfo.sponsor}
											onChange={(e) =>
												updateBasicInfo(
													"sponsor",
													e.target.value,
												)
											}
										/>
									</div>
									<div>
										<Label htmlFor="partners">
											合作伙伴
										</Label>
										<Input
											id="partners"
											value={
												agendaData.basicInfo.partners
											}
											onChange={(e) =>
												updateBasicInfo(
													"partners",
													e.target.value,
												)
											}
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="communityIntro">
										社区介绍
									</Label>
									<Textarea
										id="communityIntro"
										value={
											agendaData.basicInfo.communityIntro
										}
										onChange={(e) =>
											updateBasicInfo(
												"communityIntro",
												e.target.value,
											)
										}
										rows={3}
									/>
								</div>
							</CardContent>
						</Card>

						{/* QR Codes */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>二维码管理</CardTitle>
										<CardDescription>
											管理社区二维码和活动文档二维码，支持链接自动生成或使用本地图片
										</CardDescription>
									</div>
									<Button onClick={addQRCode} size="sm">
										<QrCode className="h-4 w-4 mr-2" />
										添加二维码
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{agendaData.qrCodes.map((qr, index) => (
										<div
											key={index}
											className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start p-4 border rounded-lg"
										>
											<div className="md:col-span-3 space-y-3">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
													<div>
														<Label>
															二维码名称
														</Label>
														<Input
															value={qr.name}
															onChange={(e) =>
																updateQRCode(
																	index,
																	"name",
																	e.target
																		.value,
																)
															}
															placeholder="活动文档"
															readOnly={
																qr.imagePath !==
																undefined
															}
														/>
													</div>
													<div>
														<Label>链接地址</Label>
														<Input
															value={qr.url}
															onChange={(e) =>
																updateQRCode(
																	index,
																	"url",
																	e.target
																		.value,
																)
															}
															placeholder="https://docs.hackathonweekly.com/..."
															readOnly={
																qr.imagePath !==
																undefined
															}
														/>
														{qr.imagePath && (
															<div className="text-xs text-amber-600 mt-1">
																*
																社区默认二维码，使用本地图片
															</div>
														)}
													</div>
												</div>
												<div>
													<Label>描述</Label>
													<Input
														value={qr.description}
														onChange={(e) =>
															updateQRCode(
																index,
																"description",
																e.target.value,
															)
														}
														placeholder="活动相关文档和资料"
														readOnly={
															qr.imagePath !==
															undefined
														}
													/>
												</div>
												{qr.url && !qr.imagePath && (
													<div className="flex items-center gap-2 text-sm text-green-600">
														<QrCode className="h-4 w-4" />
														<span>
															二维码将自动生成
														</span>
														<a
															href={qr.url}
															target="_blank"
															rel="noopener noreferrer"
															className="flex items-center gap-1 text-blue-600 hover:underline"
														>
															<ExternalLink className="h-3 w-3" />
															预览链接
														</a>
													</div>
												)}
												{qr.imagePath && (
													<div className="flex items-center gap-2 text-sm text-blue-600">
														<QrCode className="h-4 w-4" />
														<span>
															使用本地图片:{" "}
															{qr.imagePath}
														</span>
													</div>
												)}
											</div>
											<div className="flex justify-end">
												{!qr.imagePath &&
													agendaData.qrCodes.length >
														1 && (
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																removeQRCode(
																	index,
																)
															}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													)}
												{qr.imagePath && (
													<div className="text-xs text-gray-500">
														默认二维码
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Highlights */}
						<Card>
							<CardHeader>
								<CardTitle>活动亮点</CardTitle>
								<CardDescription>
									描述本次活动的亮点和特色
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Textarea
									value={agendaData.highlights}
									onChange={(e) =>
										setAgendaData((prev) => ({
											...prev,
											highlights: e.target.value,
										}))
									}
									placeholder="例如：本次黑客松将有5个团队进行项目展示，涵盖AI、Web3、可持续发展等多个领域..."
									rows={4}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Schedule */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>活动流程</CardTitle>
									<CardDescription>
										设置活动的详细流程安排
									</CardDescription>
								</div>
								<Button onClick={addScheduleItem} size="sm">
									<Plus className="h-4 w-4 mr-2" />
									添加
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{agendaData.schedule.map((item, index) => (
									<div
										key={index}
										className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start"
									>
										<div>
											<Label>时间段</Label>
											<Input
												value={item.timeRange}
												onChange={(e) =>
													updateScheduleItem(
														index,
														"timeRange",
														e.target.value,
													)
												}
												placeholder="13:00-14:00"
											/>
										</div>
										<div className="md:col-span-2">
											<Label>活动内容</Label>
											<Input
												value={item.content}
												onChange={(e) =>
													updateScheduleItem(
														index,
														"content",
														e.target.value,
													)
												}
											/>
										</div>
										<div>
											<Label>时长(分钟)</Label>
											<Input
												value={item.duration}
												onChange={(e) =>
													updateScheduleItem(
														index,
														"duration",
														e.target.value,
													)
												}
												placeholder="60"
											/>
										</div>
										<div className="flex items-center gap-2">
											<div className="flex-1">
												<Label>负责人</Label>
												<Input
													value={item.responsible}
													onChange={(e) =>
														updateScheduleItem(
															index,
															"responsible",
															e.target.value,
														)
													}
												/>
											</div>
											{agendaData.schedule.length > 1 && (
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														removeScheduleItem(
															index,
														)
													}
													className="mt-6"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Roles */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>活动角色</CardTitle>
									<CardDescription>
										设置活动工作人员角色分工
									</CardDescription>
								</div>
								<Button
									onClick={() => {
										setAgendaData((prev) => ({
											...prev,
											roles: [
												...prev.roles,
												{
													role: "",
													person: "",
												},
											],
										}));
									}}
									size="sm"
								>
									<Plus className="h-4 w-4 mr-2" />
									添加角色
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{agendaData.roles.map((role, index) => (
									<div
										key={index}
										className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start"
									>
										<div>
											<Label>角色名称</Label>
											<Input
												value={role.role}
												onChange={(e) => {
													const newRoles = [
														...agendaData.roles,
													];
													newRoles[index].role =
														e.target.value;
													setAgendaData((prev) => ({
														...prev,
														roles: newRoles,
													}));
												}}
												placeholder="活动主理人"
											/>
										</div>
										<div>
											<Label>负责人</Label>
											<Input
												value={role.person}
												onChange={(e) => {
													const newRoles = [
														...agendaData.roles,
													];
													newRoles[index].person =
														e.target.value;
													setAgendaData((prev) => ({
														...prev,
														roles: newRoles,
													}));
												}}
												placeholder="张三"
											/>
										</div>
										<div className="flex justify-end">
											{agendaData.roles.length > 1 && (
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setAgendaData(
															(prev) => ({
																...prev,
																roles: prev.roles.filter(
																	(_, i) =>
																		i !==
																		index,
																),
															}),
														);
													}}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Tips */}
					<Card>
						<CardHeader>
							<CardTitle>温馨提示</CardTitle>
							<CardDescription>
								添加给参与者的温馨提醒
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Textarea
								value={agendaData.tips}
								onChange={(e) =>
									setAgendaData((prev) => ({
										...prev,
										tips: e.target.value,
									}))
								}
								rows={3}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="preview">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>预览效果</CardTitle>
									<CardDescription>
										预览议程的打印效果
									</CardDescription>
								</div>
								<Button onClick={downloadHTML}>
									<Download className="h-4 w-4 mr-2" />
									下载HTML
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<AgendaPreview data={agendaData} />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
