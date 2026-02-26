# 变更：为活动作品提交增加音频预览播放

## Why
目前活动作品提交仅支持视频附件的内嵌预览播放，不支持音频附件预览。这会导致提交音频演示（如播客、音乐、语音助手演示）的作品无法在「作品详情」与投屏页中直接播放预览。

## What Changes
- 当作品存在 `attachments[].fileType === "audio"` 时，渲染内嵌音频播放器（带播放控件）。
- 在「作品详情」与「投屏模式」中，当作品同时存在 `coverImage` 与音频附件时，同时展示封面图与音频播放器（不开启自动播放）。
- 保持现有视频预览行为不变。

## Impact
- 影响页面：
  - `/{locale}/events/{eventId}/submissions/{submissionId}`（作品详情）
  - `/{locale}/events/{eventId}/submissions/slides`（投屏模式）
- 影响代码（预期）：
  - `src/modules/public/events/submissions/SubmissionDetail.tsx`
  - `src/modules/public/events/submissions/SubmissionsSlideDeck.tsx`
  - （可选）在 `src/modules/public/events/submissions/` 内抽取/复用媒体选择与渲染逻辑
