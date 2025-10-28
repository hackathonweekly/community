"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

interface ContactInfo {
	[key: string]: string;
}

interface ContactInfoEditorProps {
	value?: string;
	onChange: (value: string) => void;
}

// 预定义的联系方式类型
const CONTACT_TYPES = [
	{ value: "wechat", label: "微信", placeholder: "your_wechat_id" },
	{ value: "email", label: "邮箱", placeholder: "contact@example.com" },
	{ value: "phone", label: "电话", placeholder: "+86 138-0000-0000" },
	{ value: "qq", label: "QQ", placeholder: "123456789" },
	{ value: "weibo", label: "微博", placeholder: "@your_weibo" },
	{ value: "website", label: "官网", placeholder: "https://example.com" },
	{
		value: "github",
		label: "GitHub",
		placeholder: "https://github.com/username",
	},
	{
		value: "linkedin",
		label: "LinkedIn",
		placeholder: "https://linkedin.com/in/username",
	},
	{ value: "custom", label: "自定义", placeholder: "自定义联系方式" },
];

export function ContactInfoEditor({
	value = "",
	onChange,
}: ContactInfoEditorProps) {
	const [contacts, setContacts] = useState<
		Array<{ type: string; customType?: string; value: string; id: string }>
	>([]);
	const [nextId, setNextId] = useState(1);
	const initializingRef = useRef(false);
	const lastValueRef = useRef<string>("");

	// 稳定的onChange回调
	const stableOnChange = useCallback(
		(newValue: string) => {
			if (newValue !== lastValueRef.current) {
				lastValueRef.current = newValue;
				onChange(newValue);
			}
		},
		[onChange],
	);

	// 只在初始化时解析value，避免输入时重新解析
	useEffect(() => {
		if (
			!initializingRef.current &&
			value &&
			value !== lastValueRef.current
		) {
			initializingRef.current = true;
			try {
				const parsed: ContactInfo = JSON.parse(value);
				const contactArray = Object.entries(parsed).map(
					([type, contactValue], index) => ({
						type: CONTACT_TYPES.find((ct) => ct.value === type)
							? type
							: "custom",
						customType: CONTACT_TYPES.find(
							(ct) => ct.value === type,
						)
							? undefined
							: type,
						value: contactValue,
						id: `contact-${index}`,
					}),
				);
				setContacts(contactArray);
				setNextId(contactArray.length + 1);
				lastValueRef.current = value;
			} catch (e) {
				// 如果解析失败，重置为空数组
				setContacts([]);
			}
			initializingRef.current = false;
		} else if (!value && contacts.length === 0) {
			// 如果value为空且没有联系方式，确保同步
			lastValueRef.current = "";
		}
	}, [value]); // 只依赖value

	// 当联系方式数组变化时，更新JSON字符串
	useEffect(() => {
		if (initializingRef.current) {
			return; // 跳过初始化期间的更新
		}

		const contactInfo: ContactInfo = {};
		contacts.forEach((contact) => {
			const finalType =
				contact.type === "custom"
					? contact.customType || "custom"
					: contact.type;
			if (contact.value.trim()) {
				contactInfo[finalType] = contact.value.trim();
			}
		});

		const jsonString =
			Object.keys(contactInfo).length > 0
				? JSON.stringify(contactInfo)
				: "";
		stableOnChange(jsonString);
	}, [contacts, stableOnChange]);

	const addContact = () => {
		setContacts((prev) => [
			...prev,
			{
				type: "wechat",
				value: "",
				id: `contact-${nextId}`,
			},
		]);
		setNextId((prev) => prev + 1);
	};

	const removeContact = (id: string) => {
		setContacts((prev) => prev.filter((contact) => contact.id !== id));
	};

	const updateContactType = (id: string, type: string) => {
		setContacts((prev) =>
			prev.map((contact) =>
				contact.id === id
					? {
							...contact,
							type,
							customType:
								type === "custom"
									? contact.customType || ""
									: undefined,
						}
					: contact,
			),
		);
	};

	const updateContactValue = (id: string, value: string) => {
		setContacts((prev) =>
			prev.map((contact) =>
				contact.id === id ? { ...contact, value } : contact,
			),
		);
	};

	const updateCustomType = (id: string, customType: string) => {
		setContacts((prev) =>
			prev.map((contact) =>
				contact.id === id ? { ...contact, customType } : contact,
			),
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>联系方式</Label>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={addContact}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					添加联系方式
				</Button>
			</div>

			{contacts.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					<p>暂无联系方式</p>
					<p className="text-sm">
						点击上方"添加联系方式"按钮开始添加
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{contacts.map((contact) => (
						<div
							key={contact.id}
							className="flex gap-3 p-4 border rounded-lg bg-background/50"
						>
							<div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
								{/* 联系方式类型选择 */}
								<Select
									value={contact.type}
									onValueChange={(value) =>
										updateContactType(contact.id, value)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="选择类型" />
									</SelectTrigger>
									<SelectContent>
										{CONTACT_TYPES.filter(
											(type) =>
												type.value &&
												type.value.trim() !== "",
										).map((type) => (
											<SelectItem
												key={type.value}
												value={type.value}
											>
												{type.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{/* 自定义类型输入 */}
								{contact.type === "custom" && (
									<Input
										placeholder="自定义类型名称"
										value={contact.customType || ""}
										onChange={(e) =>
											updateCustomType(
												contact.id,
												e.target.value,
											)
										}
									/>
								)}

								{/* 联系方式值输入 */}
								<Input
									placeholder={
										contact.type === "custom"
											? "联系方式内容"
											: CONTACT_TYPES.find(
													(t) =>
														t.value ===
														contact.type,
												)?.placeholder || "联系方式内容"
									}
									value={contact.value}
									onChange={(e) =>
										updateContactValue(
											contact.id,
											e.target.value,
										)
									}
									className={
										contact.type === "custom"
											? ""
											: "md:col-span-2"
									}
								/>
							</div>

							{/* 删除按钮 */}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => removeContact(contact.id)}
								className="text-destructive hover:text-destructive"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			)}

			{/* 预览当前JSON（开发调试用，可以移除） */}
			{process.env.NODE_ENV === "development" && contacts.length > 0 && (
				<details className="text-xs">
					<summary className="cursor-pointer text-muted-foreground">
						预览 JSON（开发模式）
					</summary>
					<pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
						{value || "{}"}
					</pre>
				</details>
			)}
		</div>
	);
}
