import assert from "node:assert/strict";
import test from "node:test";
import AboutPage from "../../about/page";
import Home from "../page";

test("root home page renders landing content instead of redirecting", async () => {
	let homePage: Awaited<ReturnType<typeof Home>> | null = null;

	try {
		homePage = await Home();
	} catch {
		homePage = null;
	}

	assert.notEqual(homePage, null);

	const aboutPage = await AboutPage();

	assert.notEqual(aboutPage, null);
	assert.equal(homePage.type, aboutPage.type);
});
