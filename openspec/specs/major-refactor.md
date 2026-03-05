# 社区网站重构方案 v3

## 一、核心架构问题诊断

### 1.1 `/app` 前缀的来源与问题

当前项目从 SaaS 模板（类似 supastarter）演化而来，模板的设计思路是：
- `/` → 营销官网（landing、pricing、blog）
- `/app/*` → SaaS 产品仪表盘

这对 B2B SaaS 合理（Notion 的官网和产品是两个东西），但社区平台不存在"官网"和"产品"的区分。用户浏览活动和管理活动是同一个产品体验。`/app` 前缀对社区场景是多余的。

### 1.2 `[locale]` 前缀策略

当前配置：`localePrefix: "always"`，所有 URL 都带 `/zh/` 或 `/en/`。

| 场景 | 策略 | 例子 |
|------|------|------|
| 内容型网站（多语言 SEO 重要） | `always` | MDN、Wikipedia |
| 应用型产品（1-2 种语言为主） | `never` | lu.ma、GitHub、Linear |
| 我们的情况（中文为主，支持英文） | `never` | 语言通过 cookie + 用户设置决定 |

**决策：采用 `localePrefix: "never"`**。理由：
- 用户生成内容（活动、作品）基本都是中文，不存在"同一活动的中英文版本"
- 社区用户通过分享链接/微信进入，不靠 Google 搜索发现内容
- 只有 2 个语言，中文占绝对主导，URL 带 `/zh/` 纯粹是噪音
- 现有的 cookie 机制（`NEXT_LOCALE`）和用户 `locale` 字段同步逻辑已经完备，切换零成本

### 1.3 双轨路由造成的具体问题

| 问题 | 现状 | 影响 |
|------|------|------|
| 活动页面两套 | `/zh/events`（浏览）+ `/app/events`（管理） | 用户困惑，维护成本翻倍 |
| 作品页面两套 | `/zh/projects`（浏览）+ `/app/projects`（管理） | 同上 |
| Tab Bar 混合路由 | 3 个指向 `/app/*`，2 个指向 `/zh/*` | 页面风格不一致 |
| "我的"入口过深 | 点击"我的"→ 汉堡菜单 → 侧边栏 → 找功能 | 3-4 步才能到核心功能 |
| 首页无价值 | 登录后 `/app` 是空 dashboard | 信息密度极低 |

---

## 二、目标路由架构

### 2.1 设计原则

参考 lu.ma、Meetup、GitHub 的做法：
1. **单一 URL 命名空间**——不存在 `/app` 前缀
2. **同一页面根据登录状态展示不同 UI**——不为同一资源建两套页面
3. **管理操作是资源的子路由**——`/events/123/manage`，而非 `/app/events/123`
4. **i18n 完全通过 cookie + 用户设置**——URL 中不出现任何语言前缀

### 2.2 目标路由表

```
公开 + 登录用户共用（主路由）：
  /                       → 首页（未登录=落地页，已登录=发现Feed）
  /events                 → 活动列表（登录后多出"我参与的""我管理的"Tab）
  /events/create          → 创建活动（需登录）
  /events/[id]            → 活动详情（组织者多看到"管理"入口）
  /events/[id]/manage     → 活动管理（需权限）
  /events/[id]/edit       → 编辑活动（需权限）
  /events/[id]/register   → 活动报名
  /events/[id]/checkin    → 签到
  /events/[id]/submissions → 作品提交列表
  /projects               → 作品列表（登录后多出"我的作品"Tab）
  /projects/create        → 创建作品（需登录）
  /projects/[id]          → 作品详情
  /projects/[id]/edit     → 编辑作品（需权限）
  /orgs                   → 组织列表
  /orgs/[slug]            → 组织详情
  /orgs/[slug]/apply      → 申请加入
  /tasks                  → 任务列表（登录后多出"我的任务"Tab）
  /u/[username]           → 用户公开主页
  /blog                   → 博客
  /docs                   → 文档

仅登录用户（个人管理）：
  /me                     → 个人中心（"我的"Tab 入口页）
  /me/edit                → 编辑资料
  /me/bookmarks           → 我的收藏
  /me/following           → 我的关注
  /me/contributions       → 我的贡献
  /notifications          → 通知中心
  /settings/*             → 账号设置
  /admin/*                → 管理后台（超级管理员）

组织管理（需组织权限）：
  /orgs/[slug]/manage/*   → 组织管理后台
```

### 2.3 与现有路由的映射关系

| 现有路由 | 目标路由 | 迁移方式 |
|----------|----------|----------|
| `/zh/events` | `/events` | 去掉 locale 前缀（`localePrefix: "never"`） |
| `/en/events` | `/events` | 同上，语言由 cookie 决定 |
| `/app/events` | `/events?tab=my` | redirect + 合并 |
| `/zh/projects` | `/projects` | 去掉 locale 前缀 |
| `/app/projects` | `/projects?tab=my` 或 `/me` 入口 | redirect + 合并 |
| `/app/profile` | `/me` | 重构为个人中心 |
| `/app/settings/*` | `/settings/*` | 移动路由 |
| `/app/admin/*` | `/admin/*` | 移动路由 |
| `/app/[orgSlug]/*` | `/orgs/[slug]/manage/*` | 移动路由 |
| `/zh/` (首页) | `/` | 去掉 locale 前缀 |
| `/app` (dashboard) | 废弃 | 功能合并到 `/` 和 `/me` |

---

## 三、分阶段任务

> 每个 Phase 可独立交付上线，Phase 之间有推荐顺序但不强依赖。

---

### Phase 1：i18n 策略调整（完全去掉 URL 语言前缀）

**目标**：`/zh/events` → `/events`，`/en/events` → `/events`，语言完全由 cookie + 用户设置决定。

**为什么先做这个**：这是所有后续路由重构的基础，改动集中在配置层，不涉及业务逻辑。去掉 `[locale]` 动态路由段后，Phase 2 的路由迁移才能顺利进行。

**任务清单**：

1.1 修改 i18n routing 配置
  - 文件：`apps/web/src/modules/i18n/routing.ts`
  - `localePrefix: "always"` → `localePrefix: "never"`
  - `localeDetection` 保持开启（通过 Accept-Language header + cookie 检测）

1.2 更新 `apps/web/middleware.ts`
  - 移除 `[locale]` 动态段相关的路由匹配逻辑
  - 添加旧 URL 的 301 redirect：`/zh/*` → `/*`，`/en/*` → `/*`
  - 保留 cookie 同步逻辑（`session.user.locale` → `NEXT_LOCALE` cookie）

1.3 迁移 `(public)/[locale]/*` 路由文件
  - 将 `src/app/(public)/[locale]/` 下的所有页面移到 `src/app/(public)/` 下（去掉 `[locale]` 目录层级）
  - 或者直接移到未来的 `(main)/` 下（如果与 Phase 2 合并执行）

1.4 全局替换 `LocaleLink` → 标准 `Link`
  - `LocaleLink` 是 next-intl 为 locale 前缀模式创建的组件，`localePrefix: "never"` 后不再需要
  - 全局搜索 `LocaleLink`，替换为 `next/link` 的 `Link`
  - 同时替换 `useLocalePathname` → `usePathname`（from `next/navigation`）
  - 替换 `useLocaleRouter` → `useRouter`（from `next/navigation`）
  - 替换 `localeRedirect` → `redirect`（from `next/navigation`）

1.5 全局搜索并清理硬编码的 locale 路径
  - 搜索代码中所有 `"/zh/"` 和 `"/en/"` 硬编码引用
  - 搜索 `locale` 变量拼接路径的逻辑（如 TabBar.tsx 中的 `localePrefix`）
  - 清理 `useParams` 中获取 `locale` 用于路径拼接的代码

1.6 更新语言切换功能
  - 语言切换不再通过 URL 跳转实现
  - 改为：调用 `setLocaleCookie(locale)` + `router.refresh()` 刷新页面
  - 确认用户设置页面的语言切换正常工作

1.7 测试验证
  - 验证 `/events` 正常访问
  - 验证旧链接 `/zh/events` 301 跳转到 `/events`
  - 验证旧链接 `/en/events` 301 跳转到 `/events`
  - 验证 cookie 切换语言后页面内容正确切换
  - 验证分享链接（不含语言前缀）在不同语言设置下正常工作

**影响范围**：i18n 配置、middleware、所有使用 `LocaleLink` 的组件、路由文件结构
**风险**：低-中（next-intl 原生支持 `never` 模式，但需要批量替换 `LocaleLink`）
**预估改动文件**：20-30 个

---

### Phase 2：路由扁平化（消除 `/app` 前缀）

**目标**：将 `/app/*` 下的用户页面迁移到顶层路由，消除 SaaS 模板遗留的双轨结构。

**为什么第二做**：Phase 1 去掉了 locale 前缀后，路由已经变干净了。这一步把 `/app` 也去掉，实现单一命名空间。

**任务清单**：

2.1 创建新的路由组结构
  - 在 `apps/web/src/app/` 下创建 `(main)` 路由组，承载所有用户可见页面
  - `(main)` 内部按功能分组：
    ```
    src/app/(main)/
      events/          ← 从 (public)/[locale]/events 迁移
      projects/        ← 从 (public)/[locale]/projects 迁移
      orgs/            ← 从 (public)/[locale]/orgs 迁移
      tasks/           ← 从 (public)/[locale]/tasks 迁移
      u/[username]/    ← 从 (public)/[locale]/u 迁移
      blog/            ← 从 (public)/[locale]/blog 迁移
      docs/            ← 从 (public)/[locale]/docs 迁移
      me/              ← 新建，替代 /app/profile
      settings/        ← 从 (app)/app/settings 迁移
      notifications/   ← 从 (app)/app/notifications 迁移
      admin/           ← 从 (app)/app/admin 迁移
    ```

2.2 迁移 `(public)/[locale]/*` 页面到 `(main)/`
  - 将 events、projects、orgs、tasks、u、blog、docs 等页面文件移动到新位置
  - 更新 import 路径
  - 页面逻辑不变，只是路由位置变了

2.3 迁移 `(app)/app/(account)/*` 页面到 `(main)/`
  - `/app/settings/*` → `/settings/*`
  - `/app/admin/*` → `/admin/*`
  - `/app/notifications` → `/notifications`
  - `/app/events/create` → `/events/create`
  - `/app/events/[id]/edit` → `/events/[id]/edit`
  - `/app/events/[id]/manage` → `/events/[id]/manage`
  - `/app/projects/create` → `/projects/create`
  - `/app/projects/[id]/edit` → `/projects/[id]/edit`

2.4 迁移组织管理路由
  - `/app/[orgSlug]/*` → `/orgs/[slug]/manage/*`
  - 更新组织管理相关的所有链接引用

2.5 创建 `(main)/layout.tsx`
  - 合并当前 `(public)` 和 `(app)` 的 layout 逻辑
  - 统一 Provider 层（Session、i18n、Theme）
  - 条件渲染：需要认证的页面用 middleware 拦截，不在 layout 层处理

2.6 更新 middleware.ts
  - 移除 `/app` 前缀相关的路由匹配逻辑
  - 添加需要认证的路由列表：`/me/*`、`/settings/*`、`/admin/*`、`/events/create`、`/events/*/edit`、`/events/*/manage` 等
  - 未登录访问这些路由时 redirect 到 `/auth/login?callbackUrl=...`

2.7 添加旧路由 redirect
  - `/app/events` → `/events`
  - `/app/projects` → `/projects`
  - `/app/profile` → `/me`
  - `/app/settings/*` → `/settings/*`
  - `/app/admin/*` → `/admin/*`
  - 使用 `next.config.js` 的 `redirects` 或 middleware 实现

2.8 更新所有内部链接引用
  - 全局搜索 `"/app/` 开头的链接，更新到新路由
  - 更新 `use-navigation-data.ts` 中的菜单项路径
  - 更新 `TabBar.tsx` 中的链接

2.9 清理旧路由文件
  - 确认所有旧路由都有 redirect 后，删除 `(app)/app/(account)` 下已迁移的页面
  - 保留 `(app)` 路由组仅用于 `/auth/*` 认证页面（如果需要独立 layout）

**影响范围**：路由结构、middleware、所有内部链接
**风险**：中高（大量文件移动，需要仔细测试每个页面）
**预估改动文件**：50-80 个
**建议**：可以分批迁移，先迁移低风险页面（settings、admin），再迁移核心页面（events、projects）

---

### Phase 3："我的"个人中心 + 页面合并

**目标**：重构"我的"页面为个人中心入口页；将活动/作品/任务的"浏览"和"我的管理"合并到同一页面。

**为什么第三做**：Phase 2 完成后路由已经扁平化，这一步在统一的路由上做页面级别的合并和重构。

**任务清单**：

3.1 创建 `/me` 个人中心页面
  - 新建 `(main)/me/page.tsx`
  - 页面结构：
    ```
    ┌──────────────────────────────┐
    │  头像  用户名                │
    │  简介 / 等级 / 积分          │
    │  [编辑资料]  [查看主页]      │
    ├──────────────────────────────┤
    │  我的作品 (3)           →    │
    │  我的活动 (5)           →    │
    │  我的任务 (2)           →    │
    │  我的贡献               →    │
    │  我的收藏               →    │
    │  我的关注               →    │
    ├──────────────────────────────┤
    │  我的组织               →    │
    ├──────────────────────────────┤
    │  设置                   →    │
    │  帮助文档               →    │
    │  联系我们               →    │
    └──────────────────────────────┘
    ```
  - 每个列表项显示未读数/计数（通过 API 获取）
  - 点击"我的作品"→ `/projects?tab=my`
  - 点击"我的活动"→ `/events?tab=my`
  - 点击"编辑资料"→ `/me/edit`
  - 点击"设置"→ `/settings/general`

3.2 将 profile 编辑页迁移到 `/me/edit`
  - 将现有 `/app/profile` 的 `ProfileEditForm` 和 `UserAvatarForm` 迁移到 `/me/edit`

3.3 合并活动列表页面
  - 修改 `/events/page.tsx`，增加登录态 Tab 切换
  - Tab 结构：`[全部活动] [我参与的] [我管理的]`
  - "全部活动"：保持现有 SSR 逻辑不变
  - "我参与的"：客户端组件，复用现有 `useUserRegistrationsQuery`
  - "我管理的"：客户端组件，复用现有 `useUserEventsQuery`
  - 未登录用户只看到"全部活动"，不显示 Tab 切换
  - 支持 URL query param `?tab=my` 直接定位到"我参与的"

3.4 合并作品列表页面
  - 同 3.3 的模式，修改 `/projects/page.tsx`
  - Tab 结构：`[全部作品] [我的作品]`
  - "我的作品"：复用现有 `ProjectManager` 组件的数据逻辑

3.5 合并任务列表页面
  - 同 3.3 的模式，修改 `/tasks/page.tsx`
  - Tab 结构：`[全部任务] [我的任务]`

3.6 移动端移除侧边栏依赖
  - 修改 `AppWrapper.tsx`：移动端不再渲染 `MobileSidebar`
  - 侧边栏的所有功能入口已整合到 `/me` 页面
  - 桌面端侧边栏保留（桌面端空间充足，侧边栏仍有价值）

**影响范围**：个人中心页面、活动/作品/任务列表页、AppWrapper
**风险**：中（页面合并需要处理好 SSR/CSR 混合渲染）
**预估改动文件**：15-25 个

---

### Phase 4：移动端导航重构（Tab Bar + 页面头部）

**目标**：重新设计底部 Tab Bar，统一移动端页面头部，移除移动端对桌面侧边栏的依赖。

**为什么第四做**：Phase 2-3 完成后路由和页面已经统一，这一步优化导航体验。

**任务清单**：

4.1 重新设计 Tab Bar
  - 修改 `TabBar.tsx`，已登录用户 Tab 调整为：
    ```
    [发现]  [活动]  [+创建]  [消息]  [我的]
    ```
  - 未登录用户 Tab：
    ```
    [发现]  [活动]  [组织]  [登录]
    ```
  - 各 Tab 路由：
    - 发现 → `/`（首页信息流）
    - 活动 → `/events`
    - +创建 → 弹出 ActionSheet（创建活动/发布作品/发布任务）
    - 消息 → `/notifications`
    - 我的 → `/me`

4.2 实现"创建"ActionSheet
  - 点击"+"弹出底部面板（使用现有 Drawer 组件）
  - 选项：创建活动、发布作品、发布任务
  - 未登录点击跳转登录页
  - 每个选项带图标和简短描述

4.3 统一移动端页面头部
  - 创建 `MobilePageHeader` 组件，统一样式：
    ```
    简单头部：← 返回 | 页面标题 | [操作按钮]
    带Tab头部：页面标题 | [搜索] + Tab切换栏
    ```
  - 样式：`sticky top-0 z-20 bg-background border-b h-12`
  - 在所有移动端页面统一使用

4.4 首页改造
  - 未登录：保持当前落地页（intro）
  - 已登录：改为"发现"信息流页面
    - 聚合展示：最近活动、热门作品、活跃组织
    - 紧凑卡片布局，提高信息密度
    - 可以是简单的分区展示，不需要复杂的推荐算法

4.5 桌面端侧边栏更新
  - 更新 `use-navigation-data.ts` 中的菜单项，路径指向新路由
  - 移除已废弃的菜单项
  - 桌面端侧边栏继续保留，但菜单结构与 `/me` 页面保持一致

4.6 移动端彻底移除侧边栏
  - `AppWrapper.tsx` 中移动端不再渲染 `MobileSidebar` 组件
  - 移动端页面头部左侧不再显示汉堡菜单按钮
  - 所有导航通过 Tab Bar + `/me` 页面完成

**影响范围**：TabBar、页面头部、首页、AppWrapper、侧边栏
**风险**：中（导航变更影响所有页面的用户体验，需要充分测试）
**预估改动文件**：10-20 个

---

### Phase 5：移动端 UI 规范统一 + 信息密度优化

**目标**：按照统一的设计规范，优化所有页面的移动端展示效果，提高信息密度。

**为什么最后做**：前 4 个 Phase 解决了结构性问题，这一步做视觉层面的打磨。可以逐页推进，不需要一次性完成。

**任务清单**：

5.1 建立共享样式常量
  - 在 `packages/ui` 中创建移动端设计 token 文件
  - 定义统一的间距、字号、圆角、颜色语义：
    ```
    页面内边距：px-4
    卡片间距：gap-3
    区块间距：gap-6
    页面标题：text-xl font-bold
    区块标题：text-lg font-semibold
    正文：text-sm
    辅助文字：text-xs text-muted-foreground
    卡片样式：rounded-xl border bg-card p-4 shadow-sm
    紧凑卡片：rounded-lg border bg-card px-4 py-3
    触摸目标最小尺寸：44x44px (size-10)
    ```

5.2 优化活动卡片（移动端）
  - 紧凑布局：标题 + 时间/地点一行 + 状态标签
  - 移除移动端不必要的大图和留白
  - 统一状态标签颜色（即将开始=蓝、进行中=绿、已结束=灰）

5.3 优化作品卡片（移动端）
  - 两列网格布局：封面图(16:9) + 标题 + 作者
  - 紧凑间距 `gap-3`

5.4 优化组织卡片（移动端）
  - 紧凑列表：Logo + 名称 + 成员数 + 简介（一行截断）

5.5 优化用户主页（移动端）
  - 信息区块紧凑排列
  - 统计数据横向排列而非纵向堆叠
  - 作品/活动区块使用紧凑卡片

5.6 统一空状态组件
  - 创建 `EmptyState` 共享组件
  - 统一样式：居中图标 + 标题 + 描述 + 操作按钮
  - 替换各页面中不一致的空状态展示

5.7 统一加载状态
  - 所有列表页使用骨架屏（Skeleton）而非 Spinner
  - 创建通用的 `CardSkeleton`、`ListSkeleton` 组件

5.8 交互细节优化
  - 所有可点击元素添加 `active:bg-accent` 反馈
  - 确保所有触摸目标 >= 44x44px
  - 列表页支持下拉刷新手势（如果技术可行）

**影响范围**：所有面向用户的页面组件
**风险**：低（纯视觉优化，不涉及业务逻辑）
**预估改动文件**：30-50 个（可逐页推进）

---

## 四、移动端 UI 设计规范（速查表）

### 布局
```
屏幕结构：Status Bar → Page Header(48px) → Content(可滚动) → Tab Bar(56px+safe area)
页面内边距：px-4 (16px)
内容底部预留：pb-20 (80px)
```

### 字号
```
页面标题：text-xl font-bold (20px)
区块标题：text-lg font-semibold (18px)
卡片标题：text-base font-medium (16px)
正文：text-sm (14px) ← 移动端主力字号
辅助：text-xs text-muted-foreground (12px)
Tab Bar文字：text-[10px] font-medium
```

### 颜色语义
```
主操作/激活态：text-primary / bg-primary
页面背景：bg-background
卡片背景：bg-card
一级文字：text-foreground
二级文字：text-muted-foreground
分割线：border-border
成功：text-green-600    警告：text-yellow-600
错误：text-destructive  信息：text-blue-600
```

### 间距
```
卡片间距：gap-3 (12px)
区块间距：gap-6 (24px)
列表项内边距：px-4 py-3
卡片内边距：p-4
```

### 组件
```
卡片：rounded-xl border bg-card p-4 shadow-sm
紧凑卡片：rounded-lg border bg-card px-4 py-3
主按钮：h-10 rounded-lg bg-primary px-4 text-sm font-medium
次要按钮：h-10 rounded-lg border px-4 text-sm font-medium
图标按钮：size-10 rounded-lg (触摸目标 44px)
Tab Bar项：flex-col items-center gap-0.5, 图标size-6
页面头部：sticky top-0 z-20 bg-background border-b h-12 px-4
```

### 交互
```
触摸目标：最小 44x44px
点击反馈：active:bg-accent
加载状态：骨架屏优于 Spinner
空状态：居中图标 + 标题 + 描述 + 操作按钮
```

---

## 五、Phase 依赖关系与推荐顺序

```
Phase 1 (i18n: localePrefix → never)
    ↓  强依赖：去掉 [locale] 目录层后才能做路由扁平化
Phase 2 (路由扁平化: 消除 /app)  ← 最大工作量，建议分批
    ↓
Phase 3 (页面合并 + 个人中心)
    ↓
Phase 4 (导航重构)
    ↓
Phase 5 (UI 规范统一)  ← 可与 Phase 3/4 并行，逐页推进
```

Phase 1 + 2 可以合并执行（都是路由结构变更），合并后一次性完成"去 locale 前缀 + 去 app 前缀 + 建立 (main) 路由组"。
Phase 3/4/5 之间弱依赖，可以根据优先级灵活调整顺序。

