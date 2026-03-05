## 1. 规格文档对齐
- [x] 1.1 同步 proposal / design / spec 与 MVP 锁定范围（单活动单系列、非破坏式、无自动排期）。
- [x] 1.2 补充“系列订阅 + 发布通知”需求与触发规则。

## 2. 数据模型与迁移
- [x] 2.1 新增 `EventSeries`、`EventSeriesSubscription` 与 `Event.seriesId`。
- [x] 2.2 新增 `@@unique([seriesId, userId])` 与 `[seriesId, startTime]` 索引。
- [x] 2.3 生成 Prisma migration 并更新客户端。

## 3. API 与后端查询
- [x] 3.1 新增 `/api/event-series` CRUD + 订阅接口。
- [x] 3.2 扩展 `/api/events` 的系列筛选与 create/update `seriesId` 入参。
- [x] 3.3 增加活动与系列归属强校验（不匹配返回 400）。
- [x] 3.4 在发布触发点增加系列订阅通知（站内+邮件）。

## 4. 前端功能接入
- [x] 4.1 活动创建/编辑页支持选择系列（含 none 与管理入口）。
- [x] 4.2 新增系列管理页（列表、创建、编辑）。
- [x] 4.3 新增公共系列页（列表、详情，未来/历史分组）。
- [x] 4.4 活动详情页展示系列入口与订阅按钮。

## 5. 共享数据层与文案
- [x] 5.1 扩展 fetchers / hooks / query keys 支持系列能力。
- [x] 5.2 补充系列订阅与邮件模板文案（zh/en）。

## 6. 验证
- [x] 6.1 `pnpm db:generate`
- [x] 6.2 `pnpm -C apps/web type-check`
- [x] 6.3 `pnpm -C apps/web lint`
