import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { transformMDX } from "@fumadocs/content-collections/configuration";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

/**
 * Content Collections Configuration
 * Defines and configures MDX content collections for docs, blog posts, and legal pages
 */

const docs = defineCollection({
	name: "docs",
	directory: "content/docs",
	include: "**/*.mdx",
	schema: (z) => ({
		title: z.string(),
		description: z.string().optional(),
		icon: z.string().optional(),
		full: z.boolean().optional(),
		// Fumadocs OpenAPI generated
		_openapi: z.record(z.string(), z.any()).optional(),
	}),
	transform: async (document, context) => {
		const { body, toc, structuredData } = await transformMDX(
			document,
			context,
			{
				rehypePlugins: [rehypeKatex],
				remarkPlugins: [remarkMath],
			},
		);

		return {
			...document,
			mdx: body,
			toc,
			structuredData,
		};
	},
});

const docsMeta = defineCollection({
	name: "docsMeta",
	directory: "content/docs",
	include: "**/meta.json",
	parser: "json",
	schema: (z) => ({
		title: z.string().optional(),
		description: z.string().optional(),
		pages: z.array(z.string()).optional(),
		icon: z.string().optional(),
		root: z.boolean().optional(),
		defaultOpen: z.boolean().optional(),
	}),
});

const posts = defineCollection({
	name: "posts",
	directory: "content/posts",
	include: "*.mdx",
	schema: (z) => ({
		title: z.string(),
		description: z.string(),
		date: z.string(),
		published: z.boolean().default(true),
		author: z.string().optional(),
		tags: z.array(z.string()).optional(),
		image: z.string().optional(),
	}),
	transform: async (document, context) => {
		const mdx = await compileMDX(context, document);

		return {
			...document,
			mdx,
		};
	},
});

const legalPages = defineCollection({
	name: "legalPages",
	directory: "content/legal",
	include: "*.md",
	schema: (z) => ({
		title: z.string().optional(),
		description: z.string().optional(),
	}),
	transform: async (document, context) => {
		const mdx = await compileMDX(context, document);

		return {
			...document,
			mdx,
		};
	},
});

export default defineConfig({
	collections: [docs, docsMeta, posts, legalPages],
});
