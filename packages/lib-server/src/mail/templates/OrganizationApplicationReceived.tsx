import { Heading, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale } from "../translations";
import { defaultTranslations } from "../translations";
import type { BaseMailProps } from "../types";

export function OrganizationApplicationReceived({
	organizationName,
	applicantName,
	applicantEmail,
	reason,
	dashboardUrl,
	locale = defaultLocale,
	translations = defaultTranslations,
}: {
	organizationName: string;
	applicantName: string;
	applicantEmail: string;
	reason: string;
	dashboardUrl: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Heading className="text-lg font-bold text-gray-900 mb-4">
				新的组织加入申请
			</Heading>

			<Text className="text-gray-700 mb-4">
				您好，您的组织 <strong>{organizationName}</strong>{" "}
				收到了一份新的加入申请。
			</Text>

			<div className="bg-gray-50 p-4 rounded-lg mb-4">
				<Text className="text-sm text-gray-600 mb-2">
					<strong>申请人信息：</strong>
				</Text>
				<Text className="text-sm mb-1">
					<strong>姓名：</strong> {applicantName}
				</Text>
				<Text className="text-sm mb-1">
					<strong>邮箱：</strong> {applicantEmail}
				</Text>
				<Text className="text-sm mb-2">
					<strong>申请理由：</strong>
				</Text>
				<Text className="text-sm bg-white p-3 rounded border">
					{reason}
				</Text>
			</div>

			<Text className="text-gray-700 mb-6">
				请及时查看申请并做出审核决定。申请人正在等待您的回复。
			</Text>

			<PrimaryButton href={dashboardUrl}>查看申请详情</PrimaryButton>

			<Text className="text-xs text-gray-500 mt-6">
				您收到这封邮件是因为您是组织 {organizationName} 的管理员。
			</Text>
		</Wrapper>
	);
}

export default OrganizationApplicationReceived;
