"use client";

import { useCallback } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface EventPosterBase {
	startTime: string;
	endTime: string;
	address?: string;
	isOnline: boolean;
	onlineUrl?: string;
	coverImage?: string;
	description?: string | null;
	shortDescription?: string | null;
}

interface EventPosterGeneratorProps {
	eventId: string;
	eventTitle: string;
	event?: EventPosterBase;
}

const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 1334;

interface DrawTextOptions {
	x: number;
	y: number;
	maxWidth: number;
	lineHeight: number;
	maxLines: number;
	font: string;
	color: string;
	textAlign?: CanvasTextAlign;
	textBaseline?: CanvasTextBaseline;
}

interface WrapResult {
	lines: string[];
	truncated: boolean;
}

function formatEventTime(startTime: string, endTime: string) {
	const start = new Date(startTime);
	const end = new Date(endTime);

	if (start.toDateString() === end.toDateString()) {
		// 同一天的活动
		const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
			month: "numeric",
			day: "numeric",
		});
		const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
			hour: "2-digit",
			minute: "2-digit",
		});
		return `${dateFormatter.format(start)} ${timeFormatter.format(start)}-${timeFormatter.format(end)}`;
	}

	// 跨天活动，显示简洁格式
	const startDateFormatter = new Intl.DateTimeFormat("zh-CN", {
		month: "numeric",
		day: "numeric",
	});
	const endDateFormatter = new Intl.DateTimeFormat("zh-CN", {
		month: "numeric",
		day: "numeric",
	});

	return `${startDateFormatter.format(start)} - ${endDateFormatter.format(end)}`;
}

function wrapText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxLines: number,
): WrapResult {
	const characters = Array.from(text.trim());
	const lines: string[] = [];
	let line = "";
	let truncated = false;

	for (let i = 0; i < characters.length; i++) {
		const char = characters[i];
		const testLine = line + char;
		const testWidth = ctx.measureText(testLine).width;

		if (testWidth > maxWidth && line !== "") {
			lines.push(line.trimEnd());
			if (lines.length === maxLines) {
				truncated = true;
				break;
			}
			line = char;
		} else {
			line = testLine;
		}

		if (i === characters.length - 1 && lines.length < maxLines) {
			lines.push(line.trimEnd());
		}
	}

	if (!truncated && lines.length === 0 && line) {
		lines.push(line.trimEnd());
	}

	if (truncated && lines.length === maxLines) {
		let lastLine = lines[maxLines - 1];
		while (
			ctx.measureText(`${lastLine}...`).width > maxWidth &&
			lastLine.length > 1
		) {
			lastLine = lastLine.slice(0, -1);
		}
		lines[maxLines - 1] = `${lastLine}...`;
	}

	return { lines, truncated };
}

function drawText(
	ctx: CanvasRenderingContext2D,
	text: string,
	options: DrawTextOptions,
) {
	const {
		x,
		y,
		maxWidth,
		lineHeight,
		maxLines,
		font,
		color,
		textAlign,
		textBaseline,
	} = options;
	ctx.save();
	ctx.font = font;
	ctx.fillStyle = color;
	ctx.textAlign = textAlign ?? "left";
	ctx.textBaseline = textBaseline ?? "top";

	const wrapped = wrapText(ctx, text, maxWidth, maxLines);
	wrapped.lines.forEach((line, index) => {
		const drawY = y + index * lineHeight;
		ctx.fillText(line, x, drawY);
	});

	ctx.restore();
	return {
		height: lineHeight * wrapped.lines.length,
		lines: wrapped.lines,
		truncated: wrapped.truncated,
	};
}

function drawRoundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	const r = Math.min(radius, width / 2, height / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + width - r, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + r);
	ctx.lineTo(x + width, y + height - r);
	ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
	ctx.lineTo(x + r, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function drawRoundedImage(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	ctx.save();
	drawRoundedRect(ctx, x, y, width, height, radius);
	ctx.clip();

	// 计算保持宽高比的绘制参数
	const imgRatio = image.naturalWidth / image.naturalHeight;
	const containerRatio = width / height;

	let drawWidth = width;
	let drawHeight = height;
	let offsetX = x;
	let offsetY = y;

	if (imgRatio > containerRatio) {
		// 图片更宽，按高度缩放，水平居中
		drawWidth = height * imgRatio;
		offsetX = x - (drawWidth - width) / 2;
	} else {
		// 图片更高，按宽度缩放，垂直居中
		drawHeight = width / imgRatio;
		offsetY = y - (drawHeight - height) / 2;
	}

	ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
	ctx.restore();
}

async function renderQrCodeToImage(
	value: string,
	{
		size,
		bgColor,
		fgColor,
	}: {
		size: number;
		bgColor: string;
		fgColor: string;
	},
) {
	const container = document.createElement("div");
	container.style.position = "absolute";
	container.style.left = "-10000px";
	container.style.top = "0";
	document.body.appendChild(container);

	const qrHolder = document.createElement("div");
	container.appendChild(qrHolder);

	const { createRoot } = await import("react-dom/client");
	const root = createRoot(qrHolder);

	await new Promise<void>((resolve) => {
		root.render(
			<QRCode
				value={value}
				size={size}
				bgColor={bgColor}
				fgColor={fgColor}
			/>,
		);
		setTimeout(resolve, 50);
	});

	const svg = qrHolder.querySelector("svg");
	if (!svg) {
		root.unmount();
		document.body.removeChild(container);
		throw new Error("生成二维码失败");
	}

	const svgData = new XMLSerializer().serializeToString(svg);
	const base64 = window.btoa(unescape(encodeURIComponent(svgData)));
	const img = new Image();

	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error("二维码加载失败"));
		img.src = `data:image/svg+xml;base64,${base64}`;
	});

	root.unmount();
	document.body.removeChild(container);

	return img;
}

async function loadImage(url: string) {
	const img = new Image();
	img.crossOrigin = "anonymous";
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error("图片加载失败"));
		img.src = url;
	});
	return img;
}

async function renderPoster({
	ctx,
	canvas,
	eventTitle,
	timeDisplay,
	locationDisplay,
	eventUrl,
	coverImage,
	event,
}: {
	ctx: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	eventTitle: string;
	timeDisplay: string;
	locationDisplay?: string;
	eventUrl: string;
	coverImage?: HTMLImageElement;
	event?: EventPosterBase;
}) {
	// 创建背景渐变 - 参考 landing page 的紫色到蓝色渐变
	const backgroundGradient = ctx.createLinearGradient(
		0,
		0,
		canvas.width,
		canvas.height,
	);
	backgroundGradient.addColorStop(0, "#8b5cf6"); // purple-500
	backgroundGradient.addColorStop(1, "#3b82f6"); // blue-500
	ctx.fillStyle = backgroundGradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// 添加装饰性椭圆，营造层次感
	ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
	ctx.beginPath();
	ctx.ellipse(canvas.width * 0.2, 300, 200, 100, Math.PI / 8, 0, Math.PI * 2);
	ctx.fill();

	ctx.beginPath();
	ctx.ellipse(
		canvas.width * 0.85,
		800,
		180,
		120,
		-Math.PI / 6,
		0,
		Math.PI * 2,
	);
	ctx.fill();

	let currentY = 180;

	// 活动封面图片
	if (coverImage) {
		const imageHeight = 280; // 减少图片高度，从400px调整为280px
		const padding = 60; // 减少padding
		drawRoundedImage(
			ctx,
			coverImage,
			padding,
			currentY,
			canvas.width - padding * 2,
			imageHeight,
			24,
		);
		// 添加轻微遮罩增强文字可读性
		ctx.save();
		drawRoundedRect(
			ctx,
			padding,
			currentY,
			canvas.width - padding * 2,
			imageHeight,
			24,
		);
		ctx.clip();
		const overlayGradient = ctx.createLinearGradient(
			0,
			currentY + imageHeight * 0.6,
			0,
			currentY + imageHeight,
		);
		overlayGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
		overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
		ctx.fillStyle = overlayGradient;
		ctx.fillRect(
			padding,
			currentY,
			canvas.width - padding * 2,
			imageHeight,
		);
		ctx.restore();
		currentY += imageHeight + 40; // 减少图片后的间距
	} else {
		currentY += 60; // 减少无图片时的间距
	}

	// 活动标题 - 进一步减小字体
	const titleResult = drawText(ctx, eventTitle, {
		x: canvas.width / 2,
		y: currentY,
		maxWidth: canvas.width - 120,
		lineHeight: 56, // 进一步减少行高
		maxLines: 3,
		font: "700 48px 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif", // 从56px减小到48px
		color: "#ffffff",
		textAlign: "center",
	});
	currentY += titleResult.height + 35; // 减少标题后的间距

	// 活动简介 - 只显示 shortDescription
	if (event?.shortDescription) {
		const shortDescription = event.shortDescription.trim();
		if (shortDescription && shortDescription.length > 0) {
			console.log("Drawing shortDescription:", shortDescription); // Debug log
			const descResult = drawText(ctx, shortDescription, {
				x: canvas.width / 2,
				y: currentY,
				maxWidth: canvas.width - 120,
				lineHeight: 30,
				maxLines: 2,
				font: "400 20px 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
				color: "rgba(255, 255, 255, 0.9)",
				textAlign: "center",
			});
			currentY += descResult.height + 30;
		}
	}

	// 信息卡片背景
	const cardWidth = canvas.width - 120; // 减少卡片的边距
	const cardX = (canvas.width - cardWidth) / 2;
	const cardHeight = locationDisplay ? 160 : 100; // 减少卡片高度
	drawRoundedRect(ctx, cardX, currentY, cardWidth, cardHeight, 24);
	ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
	ctx.fill();

	// 活动时间
	drawText(ctx, `🗓️ ${timeDisplay}`, {
		x: canvas.width / 2,
		y: currentY + 20, // 减少内边距
		maxWidth: cardWidth - 40,
		lineHeight: 36, // 减少行高
		maxLines: 2,
		font: "600 28px 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif", // 减少字体大小
		color: "#374151",
		textAlign: "center",
	});

	// 活动地点
	if (locationDisplay) {
		drawText(ctx, `📍 ${locationDisplay}`, {
			x: canvas.width / 2,
			y: currentY + 70, // 调整位置
			maxWidth: cardWidth - 60,
			lineHeight: 36, // 减少行高
			maxLines: 2,
			font: "500 26px 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif", // 减少字体大小
			color: "#6b7280",
			textAlign: "center",
		});
	}
	currentY += cardHeight + 40; // 减少卡片后的间距

	// 计算剩余空间，确保布局合理
	const remainingSpace = canvas.height - currentY - 30; // 减少底部间距

	// 二维码 - 根据剩余空间调整大小，给更多空间
	const maxQRSize = Math.min(220, remainingSpace - 100); // 增加最大尺寸，减少预留空间
	const qrSize = Math.max(180, maxQRSize); // 增加最小尺寸
	const qrImage = await renderQrCodeToImage(eventUrl, {
		size: qrSize,
		bgColor: "#ffffff",
		fgColor: "#1f2937",
	});
	const qrX = (canvas.width - qrSize) / 2;
	const qrY = currentY + 15; // 减少顶部间距

	// 二维码背景
	drawRoundedRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12); // 减少背景边距
	ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
	ctx.fill();
	ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

	// 二维码说明文字
	drawText(ctx, "扫码报名参与活动", {
		x: canvas.width / 2,
		y: qrY + qrSize + 18, // 减少间距
		maxWidth: canvas.width - 80,
		lineHeight: 24, // 减少行高
		maxLines: 1,
		font: "600 20px 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif", // 减少字体大小
		color: "#ffffff",
		textAlign: "center",
	});

	// Logo 和品牌标识
	try {
		// 加载并显示 Logo
		const logo = await loadImage("/images/logo-white.png");
		// 调整 Logo 尺寸 - 针对长方形 logo，高度略大于字体
		const logoHeight = 24; // 略大于16px字体
		const logoY = canvas.height - 60;

		// 绘制 Logo - 保持宽高比，基于高度计算宽度
		const logoAspectRatio = logo.naturalWidth / logo.naturalHeight;
		const drawHeight = logoHeight;
		const drawWidth = logoHeight * logoAspectRatio; // 基于高度和宽高比计算宽度

		const logoX = (canvas.width - drawWidth) / 2 - 80; // Logo 居中偏左，给文字留更多空间

		ctx.drawImage(logo, logoX, logoY, drawWidth, drawHeight);

		// 品牌文字在 Logo 右侧
		drawText(ctx, "周周黑客松社区", {
			x: logoX + drawWidth + 10,
			y: logoY + drawHeight / 2,
			maxWidth: canvas.width - (logoX + drawWidth + 20),
			lineHeight: 20,
			maxLines: 1,
			font: "500 16px 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
			color: "rgba(255, 255, 255, 0.8)",
			textAlign: "left",
			textBaseline: "middle",
		});
	} catch (error) {
		console.warn("Logo加载失败，使用纯文字品牌标识:", error);
		// Logo 加载失败时的备用方案
		drawText(ctx, "周周黑客松社区", {
			x: canvas.width / 2,
			y: canvas.height - 20,
			maxWidth: canvas.width - 60,
			lineHeight: 20,
			maxLines: 1,
			font: "500 16px 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
			color: "rgba(255, 255, 255, 0.8)",
			textAlign: "center",
		});
	}
}

async function renderPosterToDataUrl({
	eventId,
	eventTitle,
	event,
	inviteCode,
}: {
	eventId: string;
	eventTitle: string;
	event: EventPosterBase;
	inviteCode?: string;
}) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("无法创建画布上下文");

	canvas.width = CANVAS_WIDTH;
	canvas.height = CANVAS_HEIGHT;

	const eventUrl = `${window.location.origin}/events/${eventId}${inviteCode ? `?invite=${inviteCode}` : ""}`;
	const timeDisplay = formatEventTime(event.startTime, event.endTime);
	const locationDisplay = event.isOnline
		? "线上活动"
		: event.address?.trim() || undefined;
	const coverImage = event.coverImage
		? await loadImage(event.coverImage)
		: undefined;

	await renderPoster({
		ctx,
		canvas,
		eventTitle,
		timeDisplay,
		locationDisplay,
		eventUrl,
		coverImage,
		event,
	});

	return canvas.toDataURL("image/jpeg", 0.85);
}

export function EventPosterGenerator({
	eventId,
	eventTitle,
	event,
}: EventPosterGeneratorProps) {
	const generatePoster = useEventPosterGenerator(eventId, eventTitle, event);

	return (
		<button
			type="button"
			onClick={generatePoster}
			style={{ display: "none" }}
		>
			Generate Poster
		</button>
	);
}

export function useEventPosterGenerator(
	eventId: string,
	eventTitle: string,
	event?: EventPosterBase,
	options?: {
		inviteCode?: string;
	},
) {
	const inviteCode = options?.inviteCode;

	return useCallback(async () => {
		if (!event) {
			toast.error("活动信息不完整，无法生成海报");
			return;
		}

		try {
			const dataUrl = await renderPosterToDataUrl({
				eventId,
				eventTitle,
				event,
				inviteCode,
			});

			const link = document.createElement("a");
			link.download = `${eventTitle}-poster.png`;
			link.href = dataUrl;
			link.click();
			toast.success("活动海报已生成并下载");
		} catch (error) {
			console.error(error);
			toast.error("海报生成失败，请稍后重试");
		}
	}, [event, eventId, eventTitle, inviteCode]);
}
