import type { Messages } from "@community/lib-shared/i18n/types";
import type { JSX as Jsx } from "react/jsx-runtime";

// temporary fix for mdx types
// TODO: remove once mdx has fully compatibility with react 19
declare global {
	namespace JSX {
		type ElementClass = Jsx.ElementClass;
		type Element = Jsx.Element;
		type IntrinsicElements = Jsx.IntrinsicElements;
	}
}

declare global {
	interface IntlMessages extends Messages {}
}

// Image file type declarations
declare module "*.png" {
	const content: string;
	export default content;
}

declare module "*.jpg" {
	const content: string;
	export default content;
}

declare module "*.jpeg" {
	const content: string;
	export default content;
}

declare module "*.svg" {
	const content: string;
	export default content;
}
