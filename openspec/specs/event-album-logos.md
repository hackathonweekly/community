# 活动相册 Logo 自定义

## 背景

当前活动相册（EventPhoto）系统支持照片上传、水印、审批等功能，但缺少品牌定制能力。运营中经常有合作方参与活动，需要在相册页面展示活动专属 Logo 或合作方 Logo，增强品牌露出。

### 现有相册能力

- `EventPhoto` 模型：支持图片上传、水印（watermarkedUrl）、审批、描述
- 相册展示组件：`apps/web/src/modules/public/events/components/EventPhotos.tsx`
- 活动本身有 `coverImage` 字段，但无独立的相册 Logo 概念

## 目标

1. 活动相册支持自定义 Logo（活动方 Logo 或合作方 Logo）
2. Logo 展示在相册页面顶部或水印中
3. 管理后台可上传和管理相册 Logo

## 数据模型设计（建议）

### 方案 A：Event 模型扩展（推荐，轻量）

在 `Event` 模型中新增字段：

```prisma
// Event 模型新增
albumLogoUrl      String?   // 相册主 Logo
albumCoLogos      Json?     // 合作方 Logo 列表，格式: [{ name: string, logoUrl: string }]
```

### 方案 B：独立模型（适合未来扩展更多合作方信息）

```prisma
model EventPartner {
  id        String   @id @default(cuid())
  eventId   String
  name      String
  logoUrl   String
  website   String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  event     Event    @relation(fields: [eventId], references: [id])
}
```

建议先用方案 A 快速实现，后续如需管理更多合作方信息再迁移到方案 B。

## 功能范围

| 功能 | 说明 |
|------|------|
| 上传相册 Logo | 活动编辑页面支持上传主 Logo |
| 添加合作方 Logo | 支持添加多个合作方 Logo（名称 + 图片） |
| 相册页面展示 | 相册顶部展示主 Logo 和合作方 Logo 栏 |
| 水印可选集成 | 可选：将 Logo 作为照片水印的一部分 |

## 页面设计参考

### 相册页面 Logo 展示区

```
┌─────────────────────────────────────┐
│  [活动主Logo]                        │
│  合作伙伴：[Logo1] [Logo2] [Logo3]   │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
└─────────────────────────────────────┘
```

## 工作量评估

| 项目 | 预估 |
|------|------|
| 数据模型 + Migration | 小（1h） |
| 后台上传 Logo 界面 | 小（2-3h） |
| 相册页面 Logo 展示 | 小（2-3h） |
| 水印集成（可选） | 中（3-4h） |
| **总计** | **约 1-2 天** |

## 风险与注意事项

- 方案 A 使用 Json 字段存储合作方 Logo 列表，需在应用层做类型校验
- Logo 图片建议限制尺寸和格式，避免影响页面加载性能
- 水印集成为可选功能，可后续单独排期
