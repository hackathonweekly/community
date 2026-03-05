# 系列活动功能

## 背景

当前系统中活动（Event）是独立的个体，没有"系列"概念。运营中存在多个持续性主题活动（如"AI 音乐系列"），需要将同一主题的活动归组展示，并提供专属页面和订阅能力，类似 lu.ma 的 Series 功能。

### 现有相关能力

- `Event.tags[]`：字符串标签，仅用于筛选，无专属页面
- `Event.organizationId`：按组织归属，粒度太粗
- `EventTemplate`：活动模板，用于快速创建，非系列概念

以上均无法满足"系列活动"的需求。

## 目标

1. 支持创建"系列活动"（EventSeries），将多个活动归入同一系列
2. 每个系列有专属公开页面，展示系列介绍、历史活动列表、即将举办的活动
3. 用户可订阅系列，新活动发布时收到通知

## 数据模型设计（建议）

### 新增模型：EventSeries

```prisma
model EventSeries {
  id              String   @id @default(cuid())
  slug            String   @unique          // URL 友好标识，如 "ai-music"
  title           String                     // 系列名称
  description     String?                    // 系列简介
  richContent     Json?                      // 富文本详细介绍
  coverImage      String?                    // 系列封面图
  logoImage       String?                    // 系列 Logo
  organizationId  String                     // 所属组织
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
  events          Event[]
  subscriptions   EventSeriesSubscription[]
}
```

### 新增模型：EventSeriesSubscription

```prisma
model EventSeriesSubscription {
  id            String   @id @default(cuid())
  seriesId      String
  userId        String
  subscribedAt  DateTime @default(now())
  notifyEmail   Boolean  @default(true)
  notifyInApp   Boolean  @default(true)

  series        EventSeries @relation(fields: [seriesId], references: [id])
  user          User        @relation(fields: [userId], references: [id])

  @@unique([seriesId, userId])
}
```

### 修改现有模型：Event

```prisma
// Event 模型新增字段
seriesId  String?
series    EventSeries? @relation(fields: [seriesId], references: [id])
```

## 功能范围

### Phase 1：基础系列功能

| 功能 | 说明 |
|------|------|
| 创建/编辑系列 | 管理后台支持创建系列，设置名称、简介、封面、Logo |
| 关联活动 | 创建/编辑活动时可选择归属系列 |
| 系列专属页面 | 公开页面 `/series/[slug]`，展示系列信息和活动列表 |
| 系列列表页 | 展示所有公开系列 |

### Phase 2：订阅与通知

| 功能 | 说明 |
|------|------|
| 订阅系列 | 用户在系列页面点击订阅 |
| 新活动通知 | 系列下发布新活动时，通知订阅用户（站内 + 邮件） |
| 订阅管理 | 用户可在个人设置中管理订阅 |

## 页面设计参考

### 系列专属页面 `/[locale]/series/[slug]`

```
┌─────────────────────────────────────┐
│  [封面图]                            │
│  系列名称          [订阅按钮]        │
│  系列简介                            │
├─────────────────────────────────────┤
│  即将举办                            │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Event │ │Event │ │Event │        │
│  └──────┘ └──────┘ └──────┘        │
├─────────────────────────────────────┤
│  往期活动                            │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Event │ │Event │ │Event │        │
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
```

## 工作量评估

| 项目 | 预估 |
|------|------|
| 数据模型 + Migration | 小（2-3h） |
| 后台管理页面（CRUD） | 中（1-1.5d） |
| 系列公开页面 | 中（1d） |
| 活动关联系列 | 小（2-3h） |
| 订阅功能 + 通知 | 中（1-1.5d） |
| **总计** | **约 4-5 天** |

## 风险与注意事项

- 需要新增 Prisma migration，注意 `Event.seriesId` 为可选字段，不影响现有数据
- 系列 slug 需做唯一性校验和 URL 安全处理
- 订阅通知可复用现有 `EventCommunication` 体系
- lu.ma 的系列页面可作为 UI 参考，但不需要完全复刻
