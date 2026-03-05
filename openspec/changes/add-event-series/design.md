# Design: event series MVP

## Context
活动系统需要补齐“长期主题运营”能力：用户可订阅系列，组织者可统一管理，公开页可查看未来与历史场次。

## Goals / Non-Goals
- Goals
  - 系列 CRUD、活动关联、公开系列页、系列订阅与发布通知。
  - 历史活动兼容（默认不关联系列）。
- Non-Goals
  - 自动周期排期/自动生成活动。
  - 单活动多系列关联。
  - 批量自动迁移历史活动。

## Key Decisions

### 1) Data model（非破坏式）
- `Event.seriesId String?`（nullable）
- `EventSeries`
  - `slug` 全局唯一
  - `isActive` 控制公开
  - 归属：`organizerId` 或 `organizationId` 二选一
- `EventSeriesSubscription`
  - `@@unique([seriesId, userId])`
  - 偏好：`notifyEmail`、`notifyInApp`
- 索引
  - `Event @@index([seriesId, startTime])`

### 2) Ownership & permission
- 归属强校验：
  - 组织活动只能关联同组织系列。
  - 个人活动只能关联同 organizer 的个人系列。
- 归属不一致时返回 `400`，给出明确错误信息。

### 3) API shape
- 系列管理：`GET/POST/PUT/DELETE /api/event-series`
- 系列订阅：`GET/POST/DELETE /api/event-series/:id/subscription`
- 事件扩展：
  - `/api/events` 支持 `seriesId`、`seriesSlug`
  - `POST /api/events` 与 `PUT /api/events/:id` 支持 `seriesId`
  - 事件响应可包含 `series` 摘要

### 4) Notification trigger
- 触发时机：
  - 新活动创建且 `status = PUBLISHED` 且有 `seriesId`
  - 活动状态从非 `PUBLISHED` -> `PUBLISHED` 且有 `seriesId`
- 渠道：
  - 站内通知（复用 `EVENT_REMINDER` 类型，metadata 写入 `seriesId/eventId`）
  - 邮件通知（按订阅偏好 + 邮件全局退订偏好过滤）

### 5) UI routes
- 管理端：`/events/series/manage` + 创建/编辑页
- 公共端：`/events/series`、`/events/series/[slug]`
- 活动详情页展示系列入口与订阅按钮

## Risks / Trade-offs
- `slug` 冲突通过自动后缀策略处理。
- 列表查询引入 series join，需关注查询性能与缓存失效。
- 通知发送失败不应影响活动发布主流程（降级记录日志）。

## Migration Plan
1. 增加表结构与外键索引。
2. 生成 Prisma client。
3. 保持历史活动 `seriesId = null`，无需强制 backfill。
