/**
 * Watermark utility for adding community logo to photos
 */

import sharp from "sharp";
import { readFile } from "fs/promises";
import { join } from "path";
import { logger } from "@community/lib-server/logs";

const LOGO_PATH = join(process.cwd(), "public/images/logo-white.png");
const DEFAULT_LOGO_SIZE = 600; // 默认Logo宽度（像素）
const DEFAULT_OPACITY = 0.7; // 默认透明度
const WATERMARK_PADDING = 30; // Logo距离边缘的内边距

interface WatermarkOptions {
	logoSize?: number;
	opacity?: number;
	position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

/**
 * Add watermark logo to an image
 * @param imageBuffer - The original image buffer
 * @param options - Watermark options
 * @returns The watermarked image buffer
 */
export async function addWatermark(
	imageBuffer: Buffer,
	options: WatermarkOptions = {},
): Promise<Buffer> {
	const {
		logoSize = DEFAULT_LOGO_SIZE,
		opacity = DEFAULT_OPACITY,
		position = "top-left",
	} = options;

	try {
		// Read logo image
		const logoBuffer = await readFile(LOGO_PATH);

		// Normalize original image orientation based on EXIF
		const baseImage = sharp(imageBuffer, { failOnError: false }).rotate();

		// Get original image metadata
		const imageMetadata = await baseImage.metadata();
		const imageWidth = imageMetadata.width || 800;
		const imageHeight = imageMetadata.height || 600;

		// Calculate logo dimensions (maintain aspect ratio)
		const logoMetadata = await sharp(logoBuffer).metadata();
		const logoAspectRatio =
			(logoMetadata.width || DEFAULT_LOGO_SIZE) /
			(logoMetadata.height || DEFAULT_LOGO_SIZE);
		// 限制最大45%，同时确保最小300px（手机照片也能清晰显示）
		const logoWidth = Math.min(
			logoSize,
			imageWidth * 0.45,
			imageWidth - WATERMARK_PADDING * 2,
		);
		const logoHeight = logoWidth / logoAspectRatio;

		// Prepare logo with opacity
		const logoWithOpacity = await sharp(logoBuffer)
			.resize(Math.round(logoWidth), Math.round(logoHeight))
			.tint({ r: 255, g: 255, b: 255, alpha: opacity })
			.toBuffer();

		// Calculate position
		let leftPos = WATERMARK_PADDING;
		let topPos = WATERMARK_PADDING;

		if (position === "top-right") {
			leftPos = imageWidth - Math.round(logoWidth) - WATERMARK_PADDING;
			topPos = WATERMARK_PADDING;
		} else if (position === "bottom-left") {
			leftPos = WATERMARK_PADDING;
			topPos = imageHeight - Math.round(logoHeight) - WATERMARK_PADDING;
		} else if (position === "bottom-right") {
			leftPos = imageWidth - Math.round(logoWidth) - WATERMARK_PADDING;
			topPos = imageHeight - Math.round(logoHeight) - WATERMARK_PADDING;
		}

		// Composite logo onto image
		const watermarkedImage = await baseImage
			.composite([
				{
					input: logoWithOpacity,
					left: leftPos,
					top: topPos,
				},
			])
			// Clear orientation so consumers don't re-rotate it
			.withMetadata({ orientation: 1 })
			.toBuffer();

		return watermarkedImage;
	} catch (error) {
		logger.error("Failed to add watermark:", error);
		throw new Error("Failed to add watermark to image");
	}
}

/**
 * Check if logo file exists
 */
export async function isLogoAvailable(): Promise<boolean> {
	try {
		await readFile(LOGO_PATH);
		return true;
	} catch {
		return false;
	}
}
