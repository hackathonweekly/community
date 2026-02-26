# Change: 添加系列活动能力（Event Series）

## Why
当前类似 AI 音乐等活动会长期举办但时间不固定，缺少一个稳定的“系列”承载页，用户难以追踪历史与后续场次；组织者也无法在管理后台对系列进行统一管理。

## What Changes
- 新增 EventSeries 实体，并在 Event 上增加可选 seriesId 关联。
- 提供组织者的系列管理与活动关联能力（创建/编辑系列、为活动选择系列）。
- 公网新增系列落地页，并在活动详情展示系列信息与入口。
- 扩展 events API 与查询支持按系列筛选，并返回系列摘要信息。
- 系列为可选关联，历史活动默认不变，支持后续补挂到系列。

## Impact
- Affected specs: event-series (new)
- Affected code: packages/lib-server/src/database/prisma/schema.prisma, packages/lib-server/src/database/prisma/queries/events.ts, src/server/routes/events.ts, apps/web/src/app/(public)/[locale]/events, src/modules/dashboard/events, packages/lib-client/src/api/*
