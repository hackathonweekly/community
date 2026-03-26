import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MobileLoginHomeButton } from "../mobile-login-home-button";

test("mobile login home button renders homepage link with mobile-only classes", () => {
	const html = renderToStaticMarkup(<MobileLoginHomeButton />);

	assert.match(html, /href="\/"/);
	assert.match(html, /返回首页/);
	assert.match(html, /lg:hidden/);
});
