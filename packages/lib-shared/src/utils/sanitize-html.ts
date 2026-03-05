import DOMPurify from "isomorphic-dompurify";

// 默认允许的标签和属性（针对富文本编辑器内容）
const DEFAULT_ALLOWED_TAGS = [
	"p",
	"br",
	"strong",
	"em",
	"u",
	"s",
	"del",
	"ins",
	"mark",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"ul",
	"ol",
	"li",
	"blockquote",
	"pre",
	"code",
	"a",
	"img",
	"table",
	"thead",
	"tbody",
	"tr",
	"th",
	"td",
	"div",
	"span",
];

const DEFAULT_ALLOWED_ATTRS = [
	"href",
	"title",
	"target",
	"rel",
	"src",
	"alt",
	"width",
	"height",
	"class",
	"style",
];

interface SanitizeOptions {
	allowedTags?: string[];
	allowedAttrs?: string[];
	allowDataAttrs?: boolean;
}

/**
 * 安全地清理 HTML 内容，防止 XSS 攻击
 * @param html 要清理的 HTML 字符串
 * @param options 清理选项
 * @returns 清理后的安全 HTML 字符串
 */
export function sanitizeHtml(
	html: string,
	options: SanitizeOptions = {},
): string {
	const {
		allowedTags = DEFAULT_ALLOWED_TAGS,
		allowedAttrs = DEFAULT_ALLOWED_ATTRS,
		allowDataAttrs = false,
	} = options;

	const config = {
		ALLOWED_TAGS: allowedTags,
		ALLOWED_ATTR: allowedAttrs,
		ALLOW_DATA_ATTR: allowDataAttrs,
		// 确保清理后的 HTML 可以安全地插入到 DOM 中
		RETURN_DOM_FRAGMENT: false,
		RETURN_DOM: false,
		// 移除不安全的标签和属性
		FORBID_TAGS: ["script", "object", "embed", "form", "input", "button"],
		FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
		// 清理 URL 协议
		ALLOWED_URI_REGEXP:
			/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
	};

	try {
		return DOMPurify.sanitize(html, config);
	} catch (error) {
		console.error("Error sanitizing HTML:", error);
		// 如果清理失败，返回空字符串而不是原始内容
		return "";
	}
}

/**
 * 用于显示用户生成内容的严格清理函数
 * @param html 要清理的 HTML 字符串
 * @returns 清理后的安全 HTML 字符串
 */
export function sanitizeUserContent(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: [
			"p",
			"br",
			"strong",
			"em",
			"u",
			"ul",
			"ol",
			"li",
			"blockquote",
			"code",
		],
		allowedAttrs: [],
		allowDataAttrs: false,
	});
}

/**
 * 用于显示富文本编辑器内容的清理函数
 * @param html 要清理的 HTML 字符串
 * @returns 清理后的安全 HTML 字符串
 */
export function sanitizeRichContent(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: DEFAULT_ALLOWED_TAGS,
		allowedAttrs: DEFAULT_ALLOWED_ATTRS,
		allowDataAttrs: false,
	});
}
