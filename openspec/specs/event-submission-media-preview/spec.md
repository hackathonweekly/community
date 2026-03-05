# event-submission-media-preview Specification

## Purpose
TBD - created by archiving change add-audio-previews-to-submissions. Update Purpose after archive.
## Requirements
### Requirement: 作品详情支持音频预览播放
当作品存在一个或多个 `fileType === "audio"` 的附件时，系统 SHALL 在作品详情页渲染内嵌音频播放器，使用户无需离开页面即可预览播放。

#### Scenario: 仅音频附件的作品
- **GIVEN** 作品附件中至少包含 1 个 `fileType === "audio"` 的条目
- **AND** 该作品未选择/未命中用于主预览的视频附件
- **WHEN** 用户打开 `/{locale}/events/{eventId}/submissions/{submissionId}`
- **THEN** 页面可见一个带播放控件的音频播放器
- **AND** 当浏览器支持时，常见格式（`mp3`、`m4a`、`wav`）可以正常播放

#### Scenario: 封面图 + 音频附件的作品
- **GIVEN** 作品设置了 `coverImage`
- **AND** 作品至少包含 1 个音频附件（`fileType === "audio"`）
- **WHEN** 用户打开 `/{locale}/events/{eventId}/submissions/{submissionId}`
- **THEN** 页面展示封面图
- **AND** 页面同时展示带播放控件的音频播放器
- **AND** 音频不会自动播放

### Requirement: 投屏模式支持音频预览播放
当作品存在一个或多个音频附件（`fileType === "audio"`）时，系统 SHALL 在投屏模式中为当前作品渲染内嵌音频播放器。

#### Scenario: 投屏模式中播放音频作品
- **GIVEN** 某活动至少有 1 个作品包含音频附件（`fileType === "audio"`）
- **WHEN** 用户打开 `/{locale}/events/{eventId}/submissions/slides` 并切换到该作品
- **THEN** 当前作品区域可见一个带播放控件的音频播放器
- **AND** 音频不会自动播放

