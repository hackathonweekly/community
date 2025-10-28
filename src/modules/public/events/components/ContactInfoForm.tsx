import { PhoneInput } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PhoneValidationResult } from "@/lib/utils/phone-validation";

interface ContactInfoFormProps {
	phoneNumber: string;
	email: string;
	wechatId: string;
	emailError?: string | null;
	onPhoneNumberChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onWechatIdChange: (value: string) => void;
	phoneValidation?: PhoneValidationResult;
}

export function ContactInfoForm({
	phoneNumber,
	email,
	wechatId,
	emailError,
	onPhoneNumberChange,
	onEmailChange,
	onWechatIdChange,
	phoneValidation,
}: ContactInfoFormProps) {
	return (
		<div className="space-y-3">
			<Label className="text-sm font-medium">
				联系方式{" "}
				<span className="text-xs text-muted-foreground hidden md:inline">
					(手机号接收活动重要通知，邮箱接收资料和社区后续更新)
				</span>
			</Label>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">
						手机号 <span className="text-red-500">*</span>
					</Label>
					<PhoneInput
						value={phoneNumber}
						onChange={(value) => onPhoneNumberChange(value)}
						onValidationChange={() => {}} // Validation is handled in parent component
						defaultCountry="+86"
						placeholder="请输入手机号"
						showValidation={
							phoneValidation && !phoneValidation.isValid
						}
						className="w-full"
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">
						邮箱 <span className="text-red-500">*</span>
					</Label>
					<Input
						type="email"
						value={email}
						onChange={(e) => onEmailChange(e.target.value)}
						placeholder="请输入常用邮箱"
						className="w-full"
					/>
					{emailError && (
						<p className="text-xs text-red-500">{emailError}</p>
					)}
				</div>
			</div>
			<div className="space-y-2">
				<Label className="text-xs text-muted-foreground">
					微信号
					<span className="ml-1 text-[11px] text-muted-foreground">
						仅互相关注后展示
					</span>
				</Label>
				<Input
					value={wechatId}
					onChange={(event) => onWechatIdChange(event.target.value)}
					placeholder="请填写常用的微信号"
					autoCapitalize="none"
					autoComplete="off"
					spellCheck={false}
					className="w-full"
				/>
				<p className="text-[11px] text-muted-foreground">
					我们会在活动前后为互相关注的伙伴展示你的微信号，方便社交联系。
				</p>
			</div>
		</div>
	);
}
