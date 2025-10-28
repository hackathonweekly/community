"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import DropCursor from "@tiptap/extension-dropcursor";
import { config } from "@/config";
import { requestImageModeration } from "@/lib/content-moderation/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	ImageIcon,
	Bold,
	Italic,
	Strikethrough,
	List,
	ListOrdered,
	Quote,
	Undo,
	Redo,
	Upload,
} from "lucide-react";
import { useRef } from "react";
import { useTranslations } from "next-intl";

interface TiptapRichEditorProps {
	value?: string;
	onChange?: (html: string, images: string[]) => void;
	placeholder?: string;
	height?: number;
}

export function TiptapRichEditor({
	value,
	onChange,
	placeholder = "开始编写活动详情...",
	height = 300,
}: TiptapRichEditorProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const imageUploadT = useTranslations("editor.imageUpload");

	// 图片上传函数 - 复用现有S3逻辑
	const uploadImage = async (file: File): Promise<string> => {
		const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split(".").pop()}`;
		const bucketName = config.storage.bucketNames.public;
		const filePath = `event-content/${fileName}`;

		// 获取签名上传URL
		const response = await fetch(
			`/api/uploads/signed-upload-url?bucket=${bucketName}&path=${filePath}&contentType=${encodeURIComponent(file.type)}`,
			{ method: "POST" },
		);

		if (!response.ok) {
			throw new Error("获取上传链接失败");
		}

		const { signedUrl } = await response.json();

		// 上传到S3
		const uploadResponse = await fetch(signedUrl, {
			method: "PUT",
			body: file,
			headers: { "Content-Type": file.type },
			mode: "cors",
		});

		if (!uploadResponse.ok) {
			throw new Error("文件上传失败");
		}

		const fileUrl = `${config.storage.endpoints.public}/${filePath}`;
		await requestImageModeration(fileUrl, "content");
		return fileUrl;
	};

	const editor = useEditor({
		extensions: [
			StarterKit,
			Image.configure({
				inline: true,
				allowBase64: false,
				HTMLAttributes: {
					class: "rounded-lg max-w-full h-auto my-2",
				},
			}),
			Placeholder.configure({
				placeholder,
			}),
			DropCursor.configure({
				color: "#3b82f6",
				width: 2,
			}),
		],
		content: value || "",
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			const images = extractImagesFromHTML(html);
			onChange?.(html, images);
		},
		editorProps: {
			attributes: {
				class: "prose max-w-none focus:outline-none px-4 py-3",
				style: `min-height: ${height - 60}px;`, // 减去工具栏高度
			},
			handleDrop: (view, event, slice, moved) => {
				if (
					!moved &&
					event.dataTransfer &&
					event.dataTransfer.files &&
					event.dataTransfer.files[0]
				) {
					const file = event.dataTransfer.files[0];
					if (file.type.startsWith("image/")) {
						event.preventDefault();
						handleImageUpload(file);
						return true;
					}
				}
				return false;
			},
			handlePaste: (view, event, slice) => {
				const items = Array.from(event.clipboardData?.items || []);
				const imageItem = items.find((item) =>
					item.type.startsWith("image/"),
				);

				if (imageItem) {
					event.preventDefault();
					const file = imageItem.getAsFile();
					if (file) handleImageUpload(file);
					return true;
				}
				return false;
			},
		},
	});

	const handleImageUpload = async (file: File) => {
		if (!file.type.startsWith("image/")) {
			toast.error(imageUploadT("selectImage"));
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error(imageUploadT("sizeLimit"));
			return;
		}

		try {
			toast.loading(imageUploadT("uploading"), { id: "image-upload" });
			const imageUrl = await uploadImage(file);

			editor
				?.chain()
				.focus()
				.setImage({
					src: imageUrl,
					alt: file.name,
					title: file.name,
				})
				.run();

			toast.success(imageUploadT("success"), { id: "image-upload" });
		} catch (error) {
			toast.error(imageUploadT("failed"), { id: "image-upload" });
			console.error("Image upload error:", error);
		}
	};

	const extractImagesFromHTML = (html: string): string[] => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		const images = doc.querySelectorAll("img");
		return Array.from(images).map((img) => img.src);
	};

	const openFileDialog = () => {
		fileInputRef.current?.click();
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			handleImageUpload(file);
		}
		// 重置input值，允许重复选择同一文件
		event.target.value = "";
	};

	if (!editor) {
		return (
			<div className="border rounded-lg" style={{ height }}>
				<div className="border-b px-3 py-2 bg-gray-50">
					<div className="flex items-center gap-1">
						{/* 占位工具栏 */}
						<div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
						<div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
						<div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>
				<div className="p-4">
					<div className="animate-pulse">
						<div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
						<div className="h-4 bg-gray-200 rounded w-1/2" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="border rounded-lg overflow-hidden" style={{ height }}>
			{/* 工具栏 */}
			<div className="border-b px-3 py-2 bg-gray-50/50 flex items-center gap-1 flex-wrap">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={`h-8 w-8 p-0 ${
						editor.isActive("bold")
							? "bg-blue-100 text-blue-700"
							: ""
					}`}
					title="粗体"
				>
					<Bold className="h-4 w-4" />
				</Button>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={`h-8 w-8 p-0 ${
						editor.isActive("italic")
							? "bg-blue-100 text-blue-700"
							: ""
					}`}
					title="斜体"
				>
					<Italic className="h-4 w-4" />
				</Button>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleStrike().run()}
					className={`h-8 w-8 p-0 ${
						editor.isActive("strike")
							? "bg-blue-100 text-blue-700"
							: ""
					}`}
					title="删除线"
				>
					<Strikethrough className="h-4 w-4" />
				</Button>

				<div className="w-px h-6 bg-gray-300 mx-1" />

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() =>
						editor.chain().focus().toggleBulletList().run()
					}
					className={`h-8 w-8 p-0 ${
						editor.isActive("bulletList")
							? "bg-blue-100 text-blue-700"
							: ""
					}`}
					title="无序列表"
				>
					<List className="h-4 w-4" />
				</Button>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() =>
						editor.chain().focus().toggleOrderedList().run()
					}
					className={`h-8 w-8 p-0 ${
						editor.isActive("orderedList")
							? "bg-blue-100 text-blue-700"
							: ""
					}`}
					title="有序列表"
				>
					<ListOrdered className="h-4 w-4" />
				</Button>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() =>
						editor.chain().focus().toggleBlockquote().run()
					}
					className={`h-8 w-8 p-0 ${
						editor.isActive("blockquote")
							? "bg-blue-100 text-blue-700"
							: ""
					}`}
					title="引用"
				>
					<Quote className="h-4 w-4" />
				</Button>

				<div className="w-px h-6 bg-gray-300 mx-1" />

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={openFileDialog}
					title="插入图片"
				>
					<Upload className="h-4 w-4" />
					<ImageIcon className="h-3 w-3 ml-1" />
				</Button>

				<div className="w-px h-6 bg-gray-300 mx-1" />

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
					title="撤销"
				>
					<Undo className="h-4 w-4" />
				</Button>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
					title="重做"
				>
					<Redo className="h-4 w-4" />
				</Button>
			</div>

			{/* 编辑器内容区 */}
			<div className="overflow-y-auto" style={{ height: height - 60 }}>
				<EditorContent editor={editor} />
			</div>

			{/* 隐藏的文件输入 */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileSelect}
				className="hidden"
			/>
		</div>
	);
}
