import { Heading, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale } from "../translations";
import { defaultTranslations } from "../translations";
import type { BaseMailProps } from "../types";

export function OrganizationApplicationApproved({
	organizationName,
	organizationUrl,
	applicantName,
	locale = defaultLocale,
	translations = defaultTranslations,
}: {
	organizationName: string;
	organizationUrl: string;
	applicantName: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Heading className="text-lg font-bold text-gray-900 mb-4">
				🎉 申请已通过！欢迎加入 {organizationName}
			</Heading>

			<Text className="text-gray-700 mb-4">
				{applicantName}，恭喜您！
			</Text>

			<Text className="text-gray-700 mb-4">
				您申请加入 <strong>{organizationName}</strong>{" "}
				的申请已经通过审核。
				现在您已经是该组织的正式成员，可以参与组织的各项活动和交流。
			</Text>

			<div className="bg-green-50 p-4 rounded-lg mb-6">
				<Text className="text-green-800 text-sm font-medium mb-2">
					✅ 接下来您可以：
				</Text>
				<Text className="text-green-700 text-sm mb-1">
					• 访问组织主页，了解最新动态
				</Text>
				<Text className="text-green-700 text-sm mb-1">
					• 参与组织举办的各种活动
				</Text>
				<Text className="text-green-700 text-sm mb-1">
					• 与其他成员交流合作
				</Text>
				<Text className="text-green-700 text-sm">
					• 贡献您的技能和经验
				</Text>
			</div>

			<PrimaryButton href={organizationUrl}>访问组织主页</PrimaryButton>

			<Text className="text-gray-700 mt-6">
				感谢您的耐心等待，期待您在组织中的积极参与！
			</Text>

			<Text className="text-xs text-gray-500 mt-6">
				如果您有任何问题，请联系组织管理员。
			</Text>
		</Wrapper>
	);
}

export default OrganizationApplicationApproved;
