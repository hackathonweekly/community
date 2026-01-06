interface AudioPlayerProps {
	src: string;
	mimeType?: string | null;
	locale: string;
	title?: string;
	className?: string;
}

function createFallbackCaptionSrc(title: string, description: string): string {
	const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
${title}

00:00:05.000 --> 00:00:10.000
${description}`;
	return `data:text/vtt;charset=utf-8,${encodeURIComponent(vttContent)}`;
}

export function AudioPlayer({
	src,
	mimeType,
	locale,
	title,
	className = "w-full",
}: AudioPlayerProps) {
	const captionLang = locale === "en" ? "en" : "zh";
	const captionLabel = locale === "en" ? "Captions" : "字幕";
	const fallbackCaptionSrc = createFallbackCaptionSrc(
		title ?? (locale === "en" ? "Audio content" : "音频内容"),
		locale === "en" ? "Audio content" : "音频内容",
	);

	return (
		<audio
			controls
			preload="metadata"
			className={className}
			aria-label={locale === "en" ? "Audio preview" : "音频预览"}
		>
			<source src={src} type={mimeType ?? undefined} />
			<track
				default
				kind="captions"
				srcLang={captionLang}
				label={captionLabel}
				src={fallbackCaptionSrc}
			/>
			{locale === "en"
				? "Your browser does not support audio playback"
				: "您的浏览器不支持音频播放"}
		</audio>
	);
}
