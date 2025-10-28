import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { remarkHeading } from "fumadocs-core/mdx-plugins";
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
	}),
	transform: async (document, context) => {
		const mdx = await compileMDX(context, document, {
			rehypePlugins: [rehypeKatex],
			remarkPlugins: [remarkMath, remarkHeading],
		});

		return {
			...document,
			mdx,
		};
	},
});

const docsMeta = defineCollection({
	name: "docsMeta",
	directory: "content/docs",
	include: "**/meta.json",
	parser: "json",
	schema: (z) => ({
		pages: z.array(z.string()).optional(),
		title: z.string().optional(),
		description: z.string().optional(),
		icon: z.string().optional(),
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
