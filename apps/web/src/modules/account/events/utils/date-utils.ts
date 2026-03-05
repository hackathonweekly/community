/**
 * 格式化日期为 datetime-local 输入框所需的格式 (YYYY-MM-DDTHH:mm)
 */
export function formatForDatetimeLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 获取默认的活动时间范围（下一个整点开始，持续2小时）
 */
export function getDefaultEventTimes() {
	const now = new Date();
	const nextHour = new Date(now);
	nextHour.setHours(now.getHours() + 1, 0, 0, 0); // 下个整点

	const twoHoursLater = new Date(nextHour);
	twoHoursLater.setHours(nextHour.getHours() + 2); // 2小时后

	return {
		startTime: formatForDatetimeLocal(nextHour),
		endTime: formatForDatetimeLocal(twoHoursLater),
	};
}

/**
 * 计算结束时间（基于开始时间加指定小时数）
 */
export function calculateEndTime(startTime: string, durationHours = 2): string {
	const startDate = new Date(startTime);

	if (Number.isNaN(startDate.getTime())) {
		throw new Error("Invalid start time");
	}

	const endDate = new Date(startDate);
	endDate.setHours(startDate.getHours() + durationHours);

	return formatForDatetimeLocal(endDate);
}
