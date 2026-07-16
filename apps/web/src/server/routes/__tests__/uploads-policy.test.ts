import assert from "node:assert/strict";
import test from "node:test";
import {
	DEFAULT_MAX_UPLOAD_SIZE,
	isUploadSizeAllowed,
	resolveMaxUploadSize,
} from "../uploads-policy";

test("upload size policy defaults to 200 MB", () => {
	assert.equal(DEFAULT_MAX_UPLOAD_SIZE, 200 * 1024 * 1024);
	assert.equal(resolveMaxUploadSize(), DEFAULT_MAX_UPLOAD_SIZE);
	assert.equal(resolveMaxUploadSize("invalid"), DEFAULT_MAX_UPLOAD_SIZE);
});

test("upload size policy accepts the limit and rejects invalid sizes", () => {
	const limit = resolveMaxUploadSize("1024");
	assert.equal(isUploadSizeAllowed(1024, limit), true);
	assert.equal(isUploadSizeAllowed(1025, limit), false);
	assert.equal(isUploadSizeAllowed(0, limit), false);
	assert.equal(isUploadSizeAllowed(Number.NaN, limit), false);
});
