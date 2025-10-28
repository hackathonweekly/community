"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { countryCodes } from "@/lib/country-codes";
import { cn } from "@/lib/utils";
import {
	validatePhoneNumber,
	type PhoneValidationResult,
} from "@/lib/utils/phone-validation";
import { normalizePhoneNumber } from "@/lib/utils/phone-format";
import { Check, ChevronDown, AlertCircle } from "lucide-react";
import { forwardRef, useState, useEffect } from "react";

interface PhoneInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	value?: string;
	onChange?: (value: string, isValid?: boolean) => void;
	defaultCountry?: string;
	onValidationChange?: (result: PhoneValidationResult) => void;
	showValidation?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
	(
		{
			className,
			value = "",
			onChange,
			defaultCountry = "+86",
			onValidationChange,
			showValidation = true,
			...props
		},
		ref,
	) => {
		const [open, setOpen] = useState(false);
		const [countryCode, setCountryCode] = useState(defaultCountry);
		const [phoneNumber, setPhoneNumber] = useState("");
		const [validationResult, setValidationResult] =
			useState<PhoneValidationResult>({ isValid: true });

		// 验证手机号码
		const validateCurrentPhone = () => {
			if (!phoneNumber.trim()) {
				const result: PhoneValidationResult = { isValid: true }; // 空值不显示错误
				setValidationResult(result);
				onValidationChange?.(result);
				return result;
			}

			const result = validatePhoneNumber(countryCode, phoneNumber);
			setValidationResult(result);
			onValidationChange?.(result);
			return result;
		};

		// 验证手机号码（延迟验证，避免用户输入时频繁提示）
		useEffect(() => {
			const timer = setTimeout(() => {
				validateCurrentPhone();
			}, 500); // 500ms延迟验证

			return () => clearTimeout(timer);
		}, [countryCode, phoneNumber]);

		// 解析完整的手机号为国家代码和手机号
		useEffect(() => {
			if (value) {
				// 首先标准化手机号格式
				const normalizedValue = normalizePhoneNumber(value);

				// 查找匹配的国家代码
				const matchingCountry = countryCodes.find((country) =>
					normalizedValue.startsWith(country.code),
				);

				if (matchingCountry) {
					setCountryCode(matchingCountry.code);
					setPhoneNumber(
						normalizedValue.slice(matchingCountry.code.length),
					);
				} else {
					// 如果没有匹配的国家代码，使用默认国家代码
					setCountryCode(defaultCountry);
					setPhoneNumber(normalizedValue);
				}
			}
		}, [value, defaultCountry]);

		const selectedCountry = countryCodes.find(
			(country) => country.code === countryCode,
		);

		const handleCountryChange = (newCountryCode: string) => {
			setCountryCode(newCountryCode);
			const fullNumber = normalizePhoneNumber(
				`${newCountryCode}${phoneNumber}`,
			);
			const validation = validatePhoneNumber(newCountryCode, phoneNumber);
			onChange?.(fullNumber, validation.isValid);
		};

		const handlePhoneNumberChange = (
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			// 只允许数字输入
			const numericValue = e.target.value.replace(/\D/g, "");
			setPhoneNumber(numericValue);
			const fullNumber = normalizePhoneNumber(
				`${countryCode}${numericValue}`,
			);
			const validation = validatePhoneNumber(countryCode, numericValue);
			onChange?.(fullNumber, validation.isValid);
		};

		return (
			<div className={cn("space-y-1", className)}>
				<div className="flex">
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								role="combobox"
								aria-expanded={open}
								className={cn(
									// 使用与Input相同的样式
									"border-input flex h-9 min-w-[85px] md:min-w-[120px] rounded-md border bg-transparent px-2 md:px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
									"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
									// 特定样式：右边不圆角，右边无边框
									"rounded-r-none border-r-0 justify-between",
									// 验证错误时的边框颜色
									!validationResult.isValid &&
										showValidation &&
										"border-destructive",
								)}
							>
								<div className="flex items-center gap-1 md:gap-2 min-w-0">
									{selectedCountry && (
										<span className="text-xs opacity-60 hidden md:inline">
											{selectedCountry.iso}
										</span>
									)}
									<span className="font-medium text-sm">
										{countryCode}
									</span>
								</div>
								<ChevronDown className="ml-1 md:ml-2 h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-[260px] md:w-[320px] p-0"
							align="start"
						>
							<Command>
								<CommandInput placeholder="搜索国家或地区..." />
								<CommandList className="max-h-[220px] overflow-auto">
									<CommandEmpty>
										未找到匹配的国家或地区
									</CommandEmpty>
									<CommandGroup>
										{countryCodes.map((country) => (
											<CommandItem
												key={country.code}
												value={`${country.country} ${country.code} ${country.iso}`}
												onSelect={() => {
													handleCountryChange(
														country.code,
													);
													setOpen(false);
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														countryCode ===
															country.code
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												<div className="flex items-center justify-between w-full">
													<div className="flex items-center gap-2 min-w-0">
														<span className="text-xs opacity-60">
															{country.iso}
														</span>
														<span className="truncate">
															{country.country}
														</span>
													</div>
													<span className="text-muted-foreground text-sm font-mono">
														{country.code}
													</span>
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
					<Input
						{...props}
						ref={ref}
						type="tel"
						value={phoneNumber}
						onChange={handlePhoneNumberChange}
						className={cn(
							"rounded-l-none border-l-0 flex-1",
							// 验证错误时的边框颜色
							!validationResult.isValid &&
								showValidation &&
								"border-destructive",
							className,
						)}
						placeholder={
							countryCode === "+86"
								? "请输入手机号码"
								: countryCode === "+1"
									? "Enter phone number"
									: "Phone number"
						}
						autoComplete="tel-national"
					/>
				</div>
				{/* 验证错误信息 */}
				{showValidation &&
					!validationResult.isValid &&
					validationResult.errorMessage && (
						<div className="flex items-center gap-1 text-sm text-destructive">
							<AlertCircle className="h-3 w-3" />
							<span>{validationResult.errorMessage}</span>
						</div>
					)}
				{/* 输入建议 */}
				{showValidation &&
					!validationResult.isValid &&
					validationResult.suggestion && (
						<div className="text-xs text-muted-foreground">
							{validationResult.suggestion}
						</div>
					)}
			</div>
		);
	},
);

PhoneInput.displayName = "PhoneInput";
