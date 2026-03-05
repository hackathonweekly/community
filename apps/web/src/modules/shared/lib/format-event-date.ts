import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";

/**
 * 格式化活动日期（卡片列表用，短格式）
 * zh: "3月15日 14:00"  en: "Mar 15, 14:00"
 */
export function formatEventDateShort(
	dateString: string,
	locale: string,
): string {
	const date = new Date(dateString);
	const dateLocale = locale === "zh" ? zhCN : enUS;

	if (locale === "zh") {
		return format(date, "M月d日 HH:mm", { locale: dateLocale });
	}
	return format(date, "MMM d, HH:mm", { locale: dateLocale });
}

/**
 * 格式化活动日期（详情页用，长格式，含星期）
 * zh: "3月15日星期六"  en: "March 15, Saturday"
 */
export function formatEventDateLong(
	dateString: string,
	locale: string,
): string {
	const date = new Date(dateString);
	const dateLocale = locale === "zh" ? zhCN : enUS;

	if (locale === "zh") {
		return format(date, "M月d日EEEE", { locale: dateLocale });
	}
	return format(date, "MMMM d, EEEE", { locale: dateLocale });
}

/**
 * 格式化时间部分
 * zh: "14:00"  en: "2:00 PM"
 */
export function formatEventTime(dateString: string, locale: string): string {
	const date = new Date(dateString);
	const dateLocale = locale === "zh" ? zhCN : enUS;

	if (locale === "zh") {
		return format(date, "H:mm", { locale: dateLocale });
	}
	return format(date, "h:mm a", { locale: dateLocale });
}
