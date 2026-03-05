# Change: 添加系列活动能力（Event Series）

## Why
当前活动以单场为主，缺少类似 lu.ma 的系列承载：
- 用户无法持续订阅某个长期主题并接收新场次提醒。
- 历史场次缺少统一聚合入口，不利于复盘与转化。
- 组织者无法在后台统一管理系列与活动归属。

## What Changes
本次交付完整 MVP（非破坏式）：
- 新增 `EventSeries` 与 `EventSeriesSubscription`，并在 `Event` 增加可选 `seriesId`。
- 提供系列 CRUD 接口与管理页（`/events/series/manage`）。
- 活动创建/编辑支持选择系列（可选，支持 `none`）。
- 公网新增系列列表与详情页（`/events/series`、`/events/series/[slug]`），展示即将开始与历史活动。
- 新增系列订阅能力（站内 + 邮件），在新活动发布时通知订阅者。
- 扩展 `/api/events` 支持 `seriesId` / `seriesSlug` 筛选，并在事件响应中返回 `series` 摘要。

## Compatibility / Rollout
- 非破坏式发布：历史活动默认 `seriesId = null`，原活动详情、列表、报名链路保持可用。
- 不做自动迁移：历史活动通过后台手动补挂到系列。

## Locked Scope (MVP)
- 单活动仅允许关联一个系列。
- 不做自动周期排期（仅聚合已存在活动）。
- 系列归属必须与活动归属一致（个人对个人、组织对同组织）。

## Impact
- Affected specs: `event-series` (new)
- Affected code: Prisma schema/migration、events/event-series routes、mail templates、活动创建编辑表单、活动详情页、公共系列页、共享 API hooks/fetchers
