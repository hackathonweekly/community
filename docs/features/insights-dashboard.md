# 社区数据看板（Insights Dashboard）

## 目标

在同一个页面下提供两层内容：

- **公开区**：任何访客都能看到的基础统计（活动规模、参与、反馈等），并在页面中直观解释每个指标的口径。
- **管理员区**：仅管理员可见的更深度分析（增长/活跃/用户画像等），用于运营决策。

## 体验入口

- 页面地址：`/{locale}/insights`（例如：`/zh/insights`）
- 路由实现：`src/app/(public)/[locale]/insights/page.tsx`

## 权限与访问控制

- 页面本身对所有人开放（用于公开区展示）。
- 管理员增强区的渲染条件：
  - 后端读取会话：`@dashboard/auth/lib/server#getSession`
  - 权限判断：`hasPermission(user, AdminPermission.VIEW_DASHBOARD)`
- **关键点**：普通用户不会触发管理员统计的数据库查询（仅渲染公开区）。

## 指标口径（公开区）

所有指标均在页面卡片中附带简短口径说明；以下为完整口径与数据来源：

### 活动

- 正在进行的活动：`Event.status = ONGOING` **或** 已发布且 `startTime <= now <= endTime`
- 未来 14 天活动：`startTime` 在未来 14 天内且 `status in (PUBLISHED, REGISTRATION_CLOSED)`
- 已结束活动：`status = COMPLETED` **或** `endTime < now`（非草稿）
- 累计活动数：`Event.status != DRAFT` 的总数

数据来源：`Event` 表（`src/lib/database/prisma/schema.prisma`）

### 参与

- 累计参与人次：`EventRegistration.status = APPROVED` 的记录数（同一用户多场活动会重复计数）
- 累计独立参与者：`EventRegistration.status = APPROVED` 按 `userId` 去重
- 累计签到次数：`EventCheckIn` 总数

数据来源：`EventRegistration`、`EventCheckIn`

### 反馈

- 平均评分：`EventFeedback.rating` 的均值（1–5）
- 推荐率：`EventFeedback.wouldRecommend = true` / `EventFeedback` 总数

数据来源：`EventFeedback`

### 近 90 天热门标签

- 口径：统计近 90 天内创建的非草稿活动的 `Event.tags` 出现次数，按次数排序取前 10

数据来源：`Event.tags`（数组字段）

## 指标口径（管理员区）

### 增长/活跃

- 总用户数：`User` 表总数
- 今日新增用户：`User.createdAt >= 今日 00:00`
- 本周新增用户：`User.createdAt >= 本周周日 00:00`
- 近 7/30 天活跃用户：`Session.updatedAt >= 近 7/30 天`，按 `userId` 去重
- 完成引导：`User.onboardingComplete = true`
- 公开个人主页：`User.profilePublic = true`
- 参与渗透率（粗略）：累计独立参与者 / 总用户数（用于宏观判断）

数据来源：`User`、`Session`

### 用户画像（聚合）

- 性别分布：`User.gender`
- 地区 Top 10：`User.region`（按人数排序）
- 等级分布：`User.membershipLevel / creatorLevel / mentorLevel / contributorLevel`
- 技能 Top 12：汇总 `User.skills` 字符串数组出现次数

### 好玩指标（洞察增强）

- 最常参加活动的用户（按报名）：`EventRegistration.status = APPROVED` 按 `userId` 分组计数（因同一活动只允许报名一次，所以等价于“参加过多少场活动”）
- 近 90 天最常参加（按报名）：在上述口径上增加 `registeredAt >= now - 90d`
- 最常签到的用户（按签到）：`EventCheckIn` 按 `userId` 分组计数
- 近 90 天最常签到（按签到）：在上述口径上增加 `checkedInAt >= now - 90d`
- 用户介绍关键词云：对公开个人主页的 `bio/currentWorkOn/whatICanOffer/whatIAmLookingFor/lifeStatus` 做分词、去停用词后计数，取 Top 60

## 性能与刷新策略

为避免高 CPU/高 I/O，统计分为三层：

- 公开区（轻量）：缓存 5 分钟自动刷新（适合频繁访问）
- 管理员区（轻量）：缓存 10 分钟自动刷新（包含画像分布与 Top 参与者）
- 关键词云（重计算）：默认不加载；缓存 6 小时自动刷新一次

手动刷新方式（URL 参数）：

- `/{locale}/insights?heavy=1`：加载关键词云（走缓存）
- `/{locale}/insights?heavy=1&refresh=1`：跳过缓存，强制重算关键词云
- `/{locale}/insights?refresh=1`：跳过缓存，强制重算轻量指标

## 实现位置

- 统计查询：`src/lib/database/prisma/queries/insights.ts`
- 页面渲染：`src/app/(public)/[locale]/insights/page.tsx`

## 后续可增强（建议）

- 时间序列：按周/月展示活动发布、报名、签到、反馈的趋势
- Cohort 留存：以注册周为 cohort，衡量后续周活跃/参与
- 活动漏斗：浏览 → 报名 → 通过 → 签到 → 反馈，按活动类型/标签分层
- 隐私增强：对低样本分组做合并/阈值隐藏，避免推断个体
