export const createFallbackCaptionSrc = (
	text: string | null | undefined,
	defaultLabel = "媒体内容",
) => {
	const sanitized = text?.replace(/\s+/g, " ").trim() ?? "";
	const captionText = sanitized.length > 0 ? sanitized : defaultLabel;
	return `data:text/vtt;charset=utf-8,${encodeURIComponent(
		`WEBVTT\n\n00:00.000 --> 00:10.000\n${captionText}`,
	)}`;
};
