# UI 重构计划 v2（精简版）

> 替代 ui-refactor.md。聚焦核心页面，桌面端改为侧边栏布局。

## 原则

1. **只改视觉，不改功能** — 数据获取、路由、状态管理全部不动
2. **每个 Phase 独立可交付** — 完成后 `pnpm build` 必须通过
3. **AI 开发时先读 `STYLE_GUIDE.md`** — 所有 class 从那里复制，不要自由发挥
4. **暗色模式同步处理** — 每个组件改完 light 立刻加 `dark:` 前缀

## 设计规范来源

- Token 速查: `/STYLE_GUIDE.md`（AI 主要参考）
- 视觉原型: `apps/web/public/ui-design/*.html`（人类视觉参考）
- 设计语言: High-Density Neo-Swiss

---

## Phase 1: 基础设施 + 全局布局骨架

**目标**: 把桌面端从顶部导航改为侧边栏导航，移动端改为底部 Tab 栏。这一步改完，所有页面的外壳就变了。

### 1.1 Design Tokens（已大部分完成，需微调）

文件:
- `apps/web/src/styles/theme.css` — 确认 CSS 变量与 STYLE_GUIDE.md 一致
- `apps/web/tailwind.config.ts` — 确认 font-brand / font-mono / fontSize.2xs / boxShadow.subtle+lift 存在

### 1.2 全局布局改造（核心改动）

文件:
- `apps/web/src/app/layout.tsx` 或对应的 public layout — 引入 sidebar + main 的 flex 布局
- `apps/web/src/modules/public/shared/components/NavBar.tsx` — **重写**: 桌面端改为 `w-60 fixed left-0` 侧边栏，移动端隐藏
- `apps/web/src/modules/public/shared/components/TabBar.tsx` — **重写**: 移动端底部导航栏 `h-14 fixed bottom-0`
- `apps/web/src/modules/public/shared/components/MobilePageHeader.tsx` — 改为紧凑 `h-12` 顶栏（仅移动端显示）

布局结构:
```
Desktop:  [Sidebar w-60 fixed] [Main lg:pl-60]
Mobile:   [TopHeader h-12 sticky] [Main] [BottomNav h-14 fixed]
```

### 1.3 shadcn 基础组件微调

文件 (packages/ui/src/ui/):
- `button.tsx` — primary 改为 bg-black，新增 pill variant (rounded-full)
- `card.tsx` — padding 改 p-3，圆角 rounded-lg
- `badge.tsx` — 改为 text-[10px] font-bold uppercase tracking-wider + 语义色
- `tabs.tsx` — 改为灰底白色 active 的 segmented control

### 验证
```bash
pnpm type-check && pnpm build
```
手动检查: 任意页面能看到侧边栏（桌面）和底部导航（移动端）

---

## Phase 2: Events 模块（最高优先级）

**目标**: Events 是用户访问最多的页面，也是 HTML 原型覆盖最完整的部分。

### 2.1 Events 列表页

文件:
- `apps/web/src/app/(main)/(public)/events/page.tsx` — 页面容器
- `EventListWithFilters.tsx` — 整体列表布局
- `EventCard.tsx` — 按 STYLE_GUIDE §6 重写（h-32 图片、p-3 内容、mono 元数据）
- `EventCardCompact.tsx` — 同上，更紧凑版本
- `EventHero.tsx` — 按 STYLE_GUIDE §7 重写 Featured 卡片
- `EventsTabs.tsx` — 按 STYLE_GUIDE §5 改为 segmented control
- `EventsFiltersClient.tsx` — 紧凑筛选栏

### 2.2 Events 详情页

文件:
- `apps/web/src/app/(main)/(public)/events/[id]/page.tsx` — 页面容器
- `Hero.tsx` (detail) — 按 STYLE_GUIDE §11 重写（tags + 大标题 + 描述）
- `EventActionSidebar.tsx` — 按 STYLE_GUIDE §11 sticky sidebar（价格 + CTA + 信息行）
- `EventInfoCard.tsx` — 信息卡片
- `EventRegistrationCard.tsx` — 黑色 CTA 按钮
- `EventStatsBar.tsx` — 紧凑统计栏
- `MobileEventBottomActions.tsx` / `MobileCTA.tsx` — 移动端底部操作栏
- `SectionCard.tsx` — 统一 section 样式

### 验证
```bash
pnpm type-check && pnpm build
```
手动检查: `/events` 列表页 + `/events/[id]` 详情页，桌面和移动端

---

## Phase 3: Projects + Profile（次优先级）

### 3.1 Projects

文件:
- `ProjectCard.tsx` — 复用 Event Card 的模式（h-32 图片 + p-3）
- `ProjectListWithFilters.tsx` — 列表布局
- `ProjectsTabs.tsx` — segmented control
- `ProjectInteractions.tsx` — 交互按钮样式
- `AdvancedFilters.tsx` — 筛选栏
- `ScrollBackButton.tsx` / `TeamRecruitment.tsx` — 细节组件

### 3.2 Profile

文件:
- `ProfileHeader.tsx` — 头部信息区
- `BadgesSection.tsx` / `CertificatesSection.tsx` — 卡片网格

### 3.3 共享组件收尾

文件:
- `PageHero.tsx` — 左对齐 + font-brand
- `Footer.tsx` — 紧凑 footer
- `EmptyState.tsx` — 更新样式

### 验证
```bash
pnpm type-check && pnpm build
```

---

## Phase 4: 其余页面（按需，不急）

以下页面优先级低，可以后续逐步处理:

1. **Home** — Hero, Features, CallToAction, FAQ 等 section 组件
2. **Organizations** — OrganizationPublicHomepage, ApplicationForm
3. **Tasks** — TaskHall, TaskDetail, MyTasks
4. **Blog / Changelog** — PostContent, PostListItem, ChangelogSection
5. **Landing Pages** — fastintro / intro / introppt / newlanding（这些是营销页，多个变体，建议后续统一为一个）

---

## 不在范围内

- Admin / Dashboard / Settings 页面 — 不动
- 数据获取逻辑 — 不动
- 路由结构 — 不动
- 新功能开发 — 不在此计划内

---

## 执行建议

1. 每个 Phase 作为一个独立 PR
2. AI 每轮开始时读 `STYLE_GUIDE.md`，确保样式一致
3. Phase 1 改完后大量组件会因为 shadcn token 变化自动跟着变
4. Phase 2 是视觉冲击最大的部分，优先做
5. Phase 4 的 landing pages 建议先不动，等核心页面稳定后再统一
