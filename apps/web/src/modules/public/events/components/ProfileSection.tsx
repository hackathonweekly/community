"use client";

import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import { Textarea } from "@community/ui/ui/textarea";
import {
	registrationFieldKeys,
	resolveRegistrationFieldConfig,
} from "@community/lib-shared/events/registration-fields";
import { getPreferredContact } from "@community/lib-shared/utils/contact";
import { getLifeStatusLabel } from "@community/lib-shared/utils/life-status";
import type { PhoneValidationResult } from "@community/lib-shared/utils/phone-validation";
import { PROFILE_LIMITS } from "@community/lib-shared/utils/profile-limits";
import { SimpleLifeStatusSelector } from "@/modules/account/profile/components/SimpleLifeStatusSelector";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { ContactInfoForm } from "./ContactInfoForm";
import type { UserProfile } from "./types";

const ROLE_MAX = PROFILE_LIMITS.userRoleStringMax;
const CURRENT_WORK_MAX = PROFILE_LIMITS.currentWorkOnMax;
const BIO_MAX = 500;
const BIO_MIN = 15;

interface EditingProfile {
	name: string;
	bio: string;
	userRoleString: string;
	currentWorkOn: string;
	phoneNumber: string;
	email: string;
	lifeStatus: string;
	wechatId: string;
	shippingAddress: string;
}

interface ProfileSectionProps {
	userProfile: UserProfile | null;
	showInlineProfileEdit: boolean;
	editingProfile: EditingProfile;
	phoneValidation: PhoneValidationResult;
	emailError: string | null;
	savingProfile: boolean;
	profileLoading: boolean;
	fieldConfig?: any;
	onToggleInlineEdit: (show: boolean) => void;
	onSaveProfile: () => void;
	onUpdateEditingProfile: (profile: Partial<EditingProfile>) => void;
	onPhoneNumberChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onLifeStatusChange: (value: string) => void;
}

export function ProfileSection({
	userProfile,
	showInlineProfileEdit,
	editingProfile,
	phoneValidation,
	emailError,
	savingProfile,
	profileLoading,
	fieldConfig,
	onToggleInlineEdit,
	onSaveProfile,
	onUpdateEditingProfile,
	onPhoneNumberChange,
	onEmailChange,
	onLifeStatusChange,
}: ProfileSectionProps) {
	const resolvedFieldConfig = resolveRegistrationFieldConfig(fieldConfig);
	const isFieldEnabled = (key: keyof typeof resolvedFieldConfig.fields) =>
		resolvedFieldConfig.fields[key]?.enabled;
	const isFieldRequired = (key: keyof typeof resolvedFieldConfig.fields) =>
		resolvedFieldConfig.fields[key]?.required;
	const requiredFields = registrationFieldKeys.filter(
		(key) => isFieldEnabled(key) && isFieldRequired(key),
	);

	// Check if userProfile is null before accessing it
	if (!userProfile || profileLoading) {
		return null;
	}

	const hasCompleteProfile = requiredFields.every((key) => {
		const value = (
			userProfile as unknown as Record<string, string | null | undefined>
		)[key];
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (key === "bio") {
				return trimmed.length >= BIO_MIN;
			}
			return trimmed.length > 0;
		}
		return Boolean(value);
	});

	// For users with complete profile
	if (hasCompleteProfile) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="text-base font-medium">
						{showInlineProfileEdit
							? "编辑个人信息"
							: "将使用以下信息报名"}
					</h4>
					{!showInlineProfileEdit && (
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => onToggleInlineEdit(true)}
							>
								编辑
							</Button>
						</div>
					)}
				</div>

				{/* Current Profile Display - only show when not editing */}
				{!showInlineProfileEdit && (
					<div className="bg-gray-50 rounded-md p-3">
						<div className="space-y-2">
							{isFieldEnabled("name") && userProfile.name && (
								<div>
									<span className="text-sm text-muted-foreground">
										姓名：
									</span>
									<span className="text-sm text-gray-700 ml-1">
										{userProfile.name}
									</span>
								</div>
							)}
							{isFieldEnabled("userRoleString") &&
								userProfile.userRoleString && (
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">
											角色：
										</span>
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{userProfile.userRoleString}
										</Badge>
									</div>
								)}
							{isFieldEnabled("currentWorkOn") &&
								userProfile.currentWorkOn && (
									<div>
										<span className="text-sm text-muted-foreground">
											当前在做：
										</span>
										<span className="text-sm text-gray-700 ml-1">
											{userProfile.currentWorkOn}
										</span>
									</div>
								)}
							{isFieldEnabled("lifeStatus") &&
								userProfile.lifeStatus && (
									<div>
										<span className="text-sm text-muted-foreground">
											当前状态：
										</span>
										<Badge
											variant="secondary"
											className="text-xs ml-1"
										>
											{getLifeStatusLabel(
												userProfile.lifeStatus,
											)}
										</Badge>
									</div>
								)}
							{isFieldEnabled("bio") && userProfile.bio && (
								<div>
									<span className="text-sm text-muted-foreground">
										简介：
									</span>
									<p className="text-sm text-gray-700 mt-1 leading-relaxed">
										{userProfile.bio}
									</p>
								</div>
							)}
							{isFieldEnabled("shippingAddress") &&
								userProfile.shippingAddress && (
									<div>
										<span className="text-sm text-muted-foreground">
											邮寄地址：
										</span>
										<p className="text-sm text-gray-700 mt-1 leading-relaxed">
											{userProfile.shippingAddress}
										</p>
									</div>
								)}
							{(isFieldEnabled("phoneNumber") ||
								isFieldEnabled("email")) &&
								(() => {
									const contactInfo = getPreferredContact(
										userProfile as any,
									);
									return contactInfo ? (
										<div>
											<span className="text-sm text-muted-foreground">
												联系方式：
											</span>
											<span className="text-sm text-gray-700 ml-1 inline-flex items-center gap-1">
												<span>{contactInfo.icon}</span>
												{contactInfo.label}：
												{contactInfo.value}
											</span>
										</div>
									) : null;
								})()}
						</div>
					</div>
				)}

				{/* Inline Edit Form - show when editing */}
				{showInlineProfileEdit && (
					<ProfileEditForm
						editingProfile={editingProfile}
						phoneValidation={phoneValidation}
						emailError={emailError}
						savingProfile={savingProfile}
						fieldConfig={resolvedFieldConfig}
						onUpdateEditingProfile={onUpdateEditingProfile}
						onPhoneNumberChange={onPhoneNumberChange}
						onEmailChange={onEmailChange}
						onLifeStatusChange={onLifeStatusChange}
						onSave={onSaveProfile}
						showRequired={true}
						onCancel={() => {
							onUpdateEditingProfile({
								name: userProfile?.name || "",
								bio: userProfile?.bio || "",
								userRoleString:
									userProfile?.userRoleString || "",
								currentWorkOn: userProfile?.currentWorkOn || "",
								phoneNumber: userProfile?.phoneNumber || "",
								email: userProfile?.email || "",
								lifeStatus: userProfile?.lifeStatus || "",
								wechatId: userProfile?.wechatId || "",
								shippingAddress:
									userProfile?.shippingAddress || "",
							});
							onToggleInlineEdit(false);
						}}
					/>
				)}
			</div>
		);
	}

	// For users with incomplete profile
	return (
		<div className="space-y-4">
			<h4 className="text-base font-medium">请填写个人资料</h4>
			<p className="text-sm text-muted-foreground mb-4">
				活动主办方会查看您的个人简介和角色信息来审核报名，完善的资料有助于提高通过率。
			</p>

			<ProfileEditForm
				editingProfile={editingProfile}
				phoneValidation={phoneValidation}
				emailError={emailError}
				savingProfile={savingProfile}
				fieldConfig={resolvedFieldConfig}
				onUpdateEditingProfile={onUpdateEditingProfile}
				onPhoneNumberChange={onPhoneNumberChange}
				onEmailChange={onEmailChange}
				onLifeStatusChange={onLifeStatusChange}
				onSave={onSaveProfile}
				showRequired={true}
			/>
		</div>
	);
}

interface ProfileEditFormProps {
	editingProfile: EditingProfile;
	phoneValidation: PhoneValidationResult;
	emailError: string | null;
	savingProfile: boolean;
	fieldConfig: any;
	onUpdateEditingProfile: (profile: Partial<EditingProfile>) => void;
	onPhoneNumberChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onLifeStatusChange: (value: string) => void;
	onSave: () => void;
	onCancel?: () => void;
	showRequired?: boolean;
}

function ProfileEditForm({
	editingProfile,
	phoneValidation,
	emailError,
	savingProfile,
	fieldConfig,
	onUpdateEditingProfile,
	onPhoneNumberChange,
	onEmailChange,
	onLifeStatusChange,
	onSave,
	onCancel,
	showRequired = false,
}: ProfileEditFormProps) {
	const resolvedFieldConfig = resolveRegistrationFieldConfig(fieldConfig);
	const isFieldEnabled = (key: keyof typeof resolvedFieldConfig.fields) =>
		resolvedFieldConfig.fields[key]?.enabled;
	const isFieldRequired = (key: keyof typeof resolvedFieldConfig.fields) =>
		resolvedFieldConfig.fields[key]?.required;
	const requiredFields = registrationFieldKeys.filter(
		(key) => isFieldEnabled(key) && isFieldRequired(key),
	);

	// 判断是否超出限制
	const isRoleExceeded = editingProfile.userRoleString.length > ROLE_MAX;
	const isCurrentWorkExceeded =
		editingProfile.currentWorkOn.length > CURRENT_WORK_MAX;
	const isBioExceeded = editingProfile.bio.length > BIO_MAX;
	const hasMissingRequired = requiredFields.some((key) => {
		const value = (
			editingProfile as unknown as Record<
				string,
				string | null | undefined
			>
		)[key];
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (key === "bio") {
				return trimmed.length < BIO_MIN;
			}
			return trimmed === "";
		}
		return !value;
	});

	return (
		<div className="bg-white rounded-md border p-4 space-y-4">
			{isFieldEnabled("name") && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						姓名
						{(showRequired || isFieldRequired("name")) && (
							<span className="text-red-500"> *</span>
						)}
					</Label>
					<Input
						value={editingProfile.name}
						onChange={(e) =>
							onUpdateEditingProfile({ name: e.target.value })
						}
						placeholder="请输入姓名"
						className="w-full"
					/>
				</div>
			)}

			{isFieldEnabled("userRoleString") && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						个人角色
						{(showRequired ||
							isFieldRequired("userRoleString")) && (
							<span className="text-red-500"> *</span>
						)}
					</Label>
					<Input
						value={editingProfile.userRoleString}
						onChange={(e) =>
							onUpdateEditingProfile({
								userRoleString: e.target.value,
							})
						}
						placeholder="例如：前端工程师、产品经理、设计师等"
						maxLength={ROLE_MAX}
						className="w-full"
					/>
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							您当前的主要职业角色
						</span>
						<span
							className={`text-xs ${
								isRoleExceeded
									? "text-red-500 font-medium"
									: "text-muted-foreground"
							}`}
						>
							{editingProfile.userRoleString.length}/{ROLE_MAX}
						</span>
					</div>
				</div>
			)}
			{isFieldEnabled("currentWorkOn") && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						当前在做
						{(showRequired || isFieldRequired("currentWorkOn")) && (
							<span className="text-red-500"> *</span>
						)}
					</Label>
					<Input
						value={editingProfile.currentWorkOn}
						onChange={(e) =>
							onUpdateEditingProfile({
								currentWorkOn: e.target.value,
							})
						}
						placeholder="例如：在做AI产品"
						maxLength={CURRENT_WORK_MAX}
						className="w-full"
					/>
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							一句话描述即可（10字以内）
						</span>
						<span
							className={`text-xs ${
								isCurrentWorkExceeded
									? "text-red-500 font-medium"
									: "text-muted-foreground"
							}`}
						>
							{editingProfile.currentWorkOn.length}/
							{CURRENT_WORK_MAX}
						</span>
					</div>
				</div>
			)}
			{isFieldEnabled("bio") && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						个人简介
						{(showRequired || isFieldRequired("bio")) && (
							<span className="text-red-500"> *</span>
						)}
					</Label>
					<Textarea
						value={editingProfile.bio}
						onChange={(e) =>
							onUpdateEditingProfile({ bio: e.target.value })
						}
						placeholder={
							showRequired
								? "请简单介绍您的技能、经验或兴趣，这将帮助活动主办方和其他参与者了解您（不少于15个字）..."
								: "请简单介绍您的技能、经验或兴趣..."
						}
						rows={3}
						maxLength={BIO_MAX}
						className="w-full"
					/>
					<div
						className={`text-xs ${
							(
								editingProfile.bio.length < BIO_MIN &&
									(showRequired || isFieldRequired("bio"))
							) || isBioExceeded
								? "text-red-500"
								: "text-muted-foreground"
						}`}
					>
						{editingProfile.bio.length}/{BIO_MAX} 字符{" "}
						{(showRequired || isFieldRequired("bio")) &&
							editingProfile.bio.length < BIO_MIN &&
							`（至少需要${BIO_MIN}个字）`}
					</div>
				</div>
			)}
			{isFieldEnabled("lifeStatus") && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						当前状态
						{(showRequired || isFieldRequired("lifeStatus")) && (
							<span className="text-red-500"> *</span>
						)}
					</Label>
					<SimpleLifeStatusSelector
						lifeStatus={editingProfile.lifeStatus}
						onStatusChange={(status) =>
							onUpdateEditingProfile({ lifeStatus: status })
						}
					/>
				</div>
			)}

			{/* Contact Information */}
			{(isFieldEnabled("phoneNumber") || isFieldEnabled("email")) && (
				<ContactInfoForm
					phoneNumber={editingProfile.phoneNumber}
					email={editingProfile.email}
					emailError={emailError}
					onPhoneNumberChange={onPhoneNumberChange}
					onEmailChange={onEmailChange}
					phoneValidation={phoneValidation}
					fieldConfig={resolvedFieldConfig}
					showRequired={showRequired}
				/>
			)}

			{isFieldEnabled("wechatId") && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						微信号
						{(showRequired || isFieldRequired("wechatId")) && (
							<span className="text-red-500"> *</span>
						)}
					</Label>
					<Input
						value={editingProfile.wechatId}
						onChange={(e) =>
							onUpdateEditingProfile({ wechatId: e.target.value })
						}
						placeholder="请输入微信号"
						className="w-full"
					/>
				</div>
			)}

			{isFieldEnabled("shippingAddress") && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						邮寄地址
						{(showRequired ||
							isFieldRequired("shippingAddress")) && (
							<span className="text-red-500"> *</span>
						)}
					</Label>
					<Textarea
						value={editingProfile.shippingAddress}
						onChange={(e) =>
							onUpdateEditingProfile({
								shippingAddress: e.target.value,
							})
						}
						placeholder="如需寄送物料，请填写完整的邮寄地址"
						rows={2}
					/>
				</div>
			)}

			{onCancel ? (
				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onCancel}
						disabled={savingProfile}
					>
						取消
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={onSave}
						disabled={savingProfile || hasMissingRequired}
					>
						{savingProfile ? "保存中..." : "保存更新"}
					</Button>
				</div>
			) : (
				<div className="flex justify-center">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						asChild
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						<a
							href="/me/edit#essential-info"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1"
						>
							完整编辑
							<ArrowTopRightOnSquareIcon className="w-3 h-3" />
						</a>
					</Button>
				</div>
			)}
		</div>
	);
}
