import { createConsola } from "consola";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

export const logger = createConsola({
	level: isProd ? 3 : 4, // production: info+, development: debug+
	formatOptions: {
		date: isProd, // 生产环境显示时间戳
		colors: isDev, // 开发环境显示颜色
		compact: isProd, // 生产环境紧凑格式
	},
});

// 为不同模块创建子 logger
export const createModuleLogger = (module: string) => {
	return logger.withTag(module);
};
