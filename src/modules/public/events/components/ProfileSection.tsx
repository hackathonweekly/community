"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPreferredContact } from "@/lib/utils/contact";
import { getLifeStatusLabel } from "@/lib/utils/life-status";
import type { PhoneValidationResult } from "@/lib/utils/phone-validation";
import { SimpleLifeStatusSelector } from "@/modules/dashboard/profile/components/SimpleLifeStatusSelector";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { ContactInfoForm } from "./ContactInfoForm";
import type { UserProfile } from "./types";

interface EditingProfile {
	bio: string;
	userRoleString: string;
	currentWorkOn: string;
	phoneNumber: string;
	email: string;
	lifeStatus: string;
	wechatId: string;
}

interface ProfileSectionProps {
	userProfile: UserProfile | null;
	showInlineProfileEdit: boolean;
	editingProfile: EditingProfile;
	phoneValidation: PhoneValidationResult;
	emailError: string | null;
	savingProfile: boolean;
	profileLoading: boolean;
	onToggleInlineEdit: (show: boolean) => void;
	onSaveProfile: () => void;
	onUpdateEditingProfile: (profile: Partial<EditingProfile>) => void;
	onPhoneNumberChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onLifeStatusChange: (value: string) => void;
	onWechatIdChange: (value: string) => void;
}

export function ProfileSection({
	userProfile,
	showInlineProfileEdit,
	editingProfile,
	phoneValidation,
	emailError,
	savingProfile,
	profileLoading,
	onToggleInlineEdit,
	onSaveProfile,
	onUpdateEditingProfile,
	onPhoneNumberChange,
	onEmailChange,
	onLifeStatusChange,
	onWechatIdChange,
}: ProfileSectionProps) {
	const hasSavedBio = userProfile?.bio?.trim();
	const hasEditingBio = editingProfile.bio.trim();

	if (!userProfile || profileLoading) {
		return null;
	}

	// For users with complete profile
	if (hasSavedBio) {
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
								快速编辑
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								asChild
								className="text-xs text-muted-foreground hover:text-foreground"
							>
								<a
									href="/app/profile#essential-info"
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

				{/* Current Profile Display - only show when not editing */}
				{!showInlineProfileEdit && (
					<div className="bg-gray-50 rounded-md p-3">
						<div className="space-y-2">
							{userProfile.userRoleString && (
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
							{userProfile.currentWorkOn && (
								<div>
									<span className="text-sm text-muted-foreground">
										当前在做：
									</span>
									<span className="text-sm text-gray-700 ml-1">
										{userProfile.currentWorkOn}
									</span>
								</div>
							)}
							{userProfile.lifeStatus && (
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
							{userProfile.bio && (
								<div>
									<span className="text-sm text-muted-foreground">
										简介：
									</span>
									<p className="text-sm text-gray-700 mt-1 leading-relaxed">
										{userProfile.bio}
									</p>
								</div>
							)}
							{(() => {
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
						onUpdateEditingProfile={onUpdateEditingProfile}
						onPhoneNumberChange={onPhoneNumberChange}
						onEmailChange={onEmailChange}
						onLifeStatusChange={onLifeStatusChange}
						onWechatIdChange={onWechatIdChange}
						onSave={onSaveProfile}
						showRequired={true}
						onCancel={() => {
							onUpdateEditingProfile({
								bio: userProfile?.bio || "",
								userRoleString:
									userProfile?.userRoleString || "",
								currentWorkOn: userProfile?.currentWorkOn || "",
								phoneNumber: userProfile?.phoneNumber || "",
								email: userProfile?.email || "",
								lifeStatus: userProfile?.lifeStatus || "",
								wechatId: userProfile?.wechatId || "",
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
				onUpdateEditingProfile={onUpdateEditingProfile}
				onPhoneNumberChange={onPhoneNumberChange}
				onEmailChange={onEmailChange}
				onLifeStatusChange={onLifeStatusChange}
				onWechatIdChange={onWechatIdChange}
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
	onUpdateEditingProfile: (profile: Partial<EditingProfile>) => void;
	onPhoneNumberChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onLifeStatusChange: (value: string) => void;
	onWechatIdChange: (value: string) => void;
	onSave: () => void;
	onCancel?: () => void;
	showRequired?: boolean;
}

function ProfileEditForm({
	editingProfile,
	phoneValidation,
	emailError,
	savingProfile,
	onUpdateEditingProfile,
	onPhoneNumberChange,
	onEmailChange,
	onLifeStatusChange,
	onWechatIdChange,
	onSave,
	onCancel,
	showRequired = false,
}: ProfileEditFormProps) {
	// 字数限制常量
	const ROLE_MAX = 10;
	const CURRENT_WORK_MAX = 100;
	const BIO_MAX = 500;
	const BIO_MIN = 15;

	// 判断是否超出限制
	const isRoleExceeded = editingProfile.userRoleString.length > ROLE_MAX;
	const isCurrentWorkExceeded =
		editingProfile.currentWorkOn.length > CURRENT_WORK_MAX;
	const isBioExceeded = editingProfile.bio.length > BIO_MAX;

	return (
		<div className="bg-white rounded-md border p-4 space-y-4">
			<div className="space-y-2">
				<Label className="text-sm font-medium">
					个人角色
					{showRequired && <span className="text-red-500"> *</span>}
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
			<div className="space-y-2">
				<Label className="text-sm font-medium">
					当前在做
					{showRequired && <span className="text-red-500"> *</span>}
				</Label>
				<Input
					value={editingProfile.currentWorkOn}
					onChange={(e) =>
						onUpdateEditingProfile({
							currentWorkOn: e.target.value,
						})
					}
					placeholder="例如：做一个AI助手产品、开发社区平台、创业项目等"
					maxLength={CURRENT_WORK_MAX}
					className="w-full"
				/>
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						您目前正在做的事情，可以是产品、项目、工作或创业等
					</span>
					<span
						className={`text-xs ${
							isCurrentWorkExceeded
								? "text-red-500 font-medium"
								: "text-muted-foreground"
						}`}
					>
						{editingProfile.currentWorkOn.length}/{CURRENT_WORK_MAX}
					</span>
				</div>
			</div>
			<div className="space-y-2">
				<Label className="text-sm font-medium">
					个人简介
					{showRequired && <span className="text-red-500"> *</span>}
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
						(editingProfile.bio.length < BIO_MIN && showRequired) ||
						isBioExceeded
							? "text-red-500"
							: "text-muted-foreground"
					}`}
				>
					{editingProfile.bio.length}/{BIO_MAX} 字符{" "}
					{showRequired &&
						editingProfile.bio.length < BIO_MIN &&
						`（至少需要${BIO_MIN}个字）`}
				</div>
			</div>
			<div className="space-y-2">
				<Label className="text-sm font-medium">
					当前状态
					{showRequired && <span className="text-red-500"> *</span>}
				</Label>
				<SimpleLifeStatusSelector
					lifeStatus={editingProfile.lifeStatus}
					onStatusChange={(status) =>
						onUpdateEditingProfile({ lifeStatus: status })
					}
				/>
			</div>

			{/* Contact Information */}
			<ContactInfoForm
				phoneNumber={editingProfile.phoneNumber}
				email={editingProfile.email}
				wechatId={editingProfile.wechatId}
				emailError={emailError}
				onPhoneNumberChange={onPhoneNumberChange}
				onEmailChange={onEmailChange}
				onWechatIdChange={onWechatIdChange}
				phoneValidation={phoneValidation}
			/>

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
						disabled={
							savingProfile ||
							(showRequired &&
								(!editingProfile.bio.trim() ||
									editingProfile.bio.length < 15 ||
									!editingProfile.userRoleString.trim() ||
									!editingProfile.currentWorkOn.trim() ||
									!editingProfile.lifeStatus.trim() ||
									!editingProfile.phoneNumber.trim() ||
									!editingProfile.email.trim()))
						}
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
							href="/app/profile#essential-info"
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
