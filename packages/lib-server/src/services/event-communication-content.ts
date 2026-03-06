const IMAGE_MARKER_PREFIX = "[HW_IMAGE_URL:";
const IMAGE_MARKER_REGEX = /\n{2}\[HW_IMAGE_URL:([^\]]+)\]\s*$/;

interface SerializeCommunicationContentInput {
	content: string;
	imageUrl?: string | null;
}

interface ParsedCommunicationContent {
	content: string;
	imageUrl?: string;
}

function normalizeImageUrl(imageUrl?: string | null) {
	if (!imageUrl) {
		return undefined;
	}

	const trimmed = imageUrl.trim();
	if (!trimmed) {
		return undefined;
	}

	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return undefined;
		}
		return parsed.toString();
	} catch {
		return undefined;
	}
}

export function serializeCommunicationContent(
	input: SerializeCommunicationContentInput,
) {
	const content = input.content.replace(/\s+$/, "");
	const imageUrl = normalizeImageUrl(input.imageUrl);

	if (!imageUrl) {
		return content;
	}

	return `${content}\n\n${IMAGE_MARKER_PREFIX}${imageUrl}]`;
}

export function parseCommunicationContent(
	storedContent: string,
): ParsedCommunicationContent {
	const matched = storedContent.match(IMAGE_MARKER_REGEX);
	if (!matched) {
		return { content: storedContent };
	}

	const imageUrl = normalizeImageUrl(matched[1]);
	const content = storedContent
		.slice(0, matched.index ?? storedContent.length)
		.replace(/\s+$/, "");

	if (!imageUrl) {
		return { content };
	}

	return {
		content,
		imageUrl,
	};
}
