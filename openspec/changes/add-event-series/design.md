# Design: event series

## Context
活动目前是独立实体，类似 AI 音乐等长期系列活动无法沉淀为稳定入口，也缺少统一管理与聚合展示。

## Goals / Non-Goals
- Goals:
  - 支持创建“系列活动”并将多个活动归入同一系列。
  - 公网可展示系列介绍与历史/未来活动列表。
  - 兼容历史活动：不强制关联系列，按需补挂。
- Non-Goals:
  - 不做自动排期/周期规则生成（仅聚合已有活动）。
  - 不支持单个活动同时属于多个系列（如需可后续扩展）。

## Decisions
- Data model:
  - 新增 `EventSeries` 表：`id`、`name`、`slug`、`description`、`coverImage`、`tags`、`organizerId`、`organizationId`、`status`、`createdAt`、`updatedAt`。
  - `Event.seriesId` 可选外键，新增 `@@index([seriesId, startTime])` 便于按系列时间排序。
- Ownership & permissions:
  - 系列归属到组织或个人主办方，只有同一主办方下的活动可关联。
  - 系列管理权限沿用活动创建/编辑权限模型。
- API shape:
  - `GET /api/event-series`：列表（支持 owner、search 过滤）。
  - `GET /api/event-series/:slug`：返回系列详情 + 活动列表（按时间分组）。
  - `POST/PUT/DELETE /api/event-series`：系列管理（权限校验）。
  - `GET /api/events` 支持 `seriesId` 或 `seriesSlug` 筛选；事件 payload 增加 `series` 摘要。
- UI/UX:
  - Dashboard 增加系列管理入口（建议在 `/app/events` 下新增 “Series” 子页）。
  - 活动创建/编辑页提供系列选择与快速创建。
  - 公网页新增 `/events/series/[slug]` 落地页；活动详情页展示系列卡片与入口。

## Risks / Trade-offs
- `slug` 唯一性冲突需要处理（建议保存时校验并自动追加后缀）。
- 事件列表查询增加 series join，需注意性能与缓存标签更新。

## Migration Plan
- 新增 `EventSeries` 表 + `Event.seriesId` 字段与索引。
- 不做强制 backfill，历史活动默认 `seriesId = null`。
- 如需要批量挂载历史活动，可提供一次性脚本或后台批量操作。

## Open Questions
- 是否允许一个活动属于多个系列？（当前方案：单系列）
- 系列归属是否必须与活动组织一致？是否需要跨组织系列？
- 系列落地页 URL 使用 `slug` 还是 `id`？
- 系列管理入口放在 `/app/events` 还是组织后台？
