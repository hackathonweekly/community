import { Heading, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale } from "../translations";
import { defaultTranslations } from "../translations";
import type { BaseMailProps } from "../types";

export function OrganizationApplicationRejected({
	organizationName,
	organizationUrl,
	applicantName,
	reviewNote,
	locale = defaultLocale,
	translations = defaultTranslations,
}: {
	organizationName: string;
	organizationUrl: string;
	applicantName: string;
	reviewNote?: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Heading className="text-lg font-bold text-gray-900 mb-4">
				关于您的组织申请
			</Heading>

			<Text className="text-gray-700 mb-4">
				{applicantName}，感谢您对 <strong>{organizationName}</strong>{" "}
				的关注。
			</Text>

			<Text className="text-gray-700 mb-4">
				很遗憾，您的加入申请暂时未能通过审核。这可能是由于组织当前的成员需求、
				技能匹配度或其他因素导致的。
			</Text>

			{reviewNote && (
				<div className="bg-blue-50 p-4 rounded-lg mb-6">
					<Text className="text-blue-800 text-sm font-medium mb-2">
						📝 管理员留言：
					</Text>
					<Text className="text-blue-700 text-sm">{reviewNote}</Text>
				</div>
			)}

			<Text className="text-gray-700 mb-4">请不要灰心！您可以：</Text>

			<div className="bg-gray-50 p-4 rounded-lg mb-6">
				<Text className="text-gray-700 text-sm mb-1">
					• 继续关注组织动态，等待合适的时机再次申请
				</Text>
				<Text className="text-gray-700 text-sm mb-1">
					• 完善个人资料和技能标签
				</Text>
				<Text className="text-gray-700 text-sm mb-1">
					• 参与组织的公开活动，展示您的能力
				</Text>
				<Text className="text-gray-700 text-sm">
					• 寻找其他合适的组织加入
				</Text>
			</div>

			<PrimaryButton href={organizationUrl}>
				了解更多组织信息
			</PrimaryButton>

			<Text className="text-gray-700 mt-6">
				再次感谢您的申请，祝您在社区中找到合适的发展机会！
			</Text>

			<Text className="text-xs text-gray-500 mt-6">
				如果您对审核结果有疑问，可以联系组织管理员进行沟通。
			</Text>
		</Wrapper>
	);
}

export default OrganizationApplicationRejected;
