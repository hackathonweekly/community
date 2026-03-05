import assert from "node:assert/strict";
import test from "node:test";
import {
	PHOTO_ALBUM_SHARE_OPTIONS,
	buildPhotoAlbumShareText,
} from "../share-options";

test("photo album share options keep required order", () => {
	assert.deepEqual(
		PHOTO_ALBUM_SHARE_OPTIONS.map((option) => option.id),
		["qr", "native", "copyLink"],
	);
	assert.deepEqual(
		PHOTO_ALBUM_SHARE_OPTIONS.map((option) => option.label),
		["分享二维码", "原生分享", "复制链接"],
	);
});

test("buildPhotoAlbumShareText uses event title and fallback", () => {
	assert.equal(
		buildPhotoAlbumShareText("AI 创业周"),
		"活动【AI 创业周】现场照片来啦！",
	);
	assert.equal(buildPhotoAlbumShareText(""), "活动【活动】现场照片来啦！");
});
