╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 UI 重构计划：Modern Editorial (High-Density Neo-Swiss) 风格

 Context

 当前网站 UI 是多次迭代的杂糅版本，缺乏统一规范。用户决定基于 apps/web/public/ui-design/ 下的
  HTML 原型（design_system.html、events.html、event_detail.html）和
 apps/web/content/docs/dev-guide/ui-style.zh.mdx 中定义的 "Modern Editorial"
 风格，对所有公开页面进行 UI 重写。只改视觉，不改功能。

 设计规范速查（来自原型）

 - 字体: Space Grotesk (标题 font-brand) / Inter (正文 font-sans) / JetBrains Mono (代码
 font-mono)
 - 色板: 黑白灰为主 — Page #FAFAFA, Card #FFFFFF, Border #E5E7EB, Secondary #6B7280, Primary
 #000000
 - 圆角: Card rounded-lg (12px), Featured rounded-xl (16px), Button rounded-full (pill) 或
 rounded-md
 - 间距: Card padding p-3 (12px), Grid gap gap-4 (16px)
 - 标签: text-[10px] font-bold uppercase tracking-wider + 语义色背景
 - 元数据: font-mono text-xs text-gray-500
 - CTA: 黑底白字 bg-black text-white rounded-full/rounded-md
 - 暗色模式: 保留，基于 Tailwind dark: 前缀实现

 重构范围

 所有 public 路由页面（~48 页）+ 共享组件。Admin/Dashboard/Settings 页面不动。

 分阶段执行

 Phase 0: 基础设施（Design Tokens + Tailwind Config）

 改动文件：
 - apps/web/src/styles/theme.css — 重写 CSS 变量，新色板映射到 shadcn token 体系
 - apps/web/tailwind.config.ts — 添加 font-brand、font-mono、自定义圆角/阴影/字号
 - apps/web/src/app/globals.css — 更新全局基础样式（body bg、selection 色等）
 - apps/web/src/app/layout.tsx — 引入 Space Grotesk + JetBrains Mono 字体

 具体改动：
 1. theme.css :root 变量更新：
   - --primary → #000000 (黑), --primary-foreground → #FFFFFF
   - --background → #FAFAFA, --foreground → #111111
   - --border → #E5E7EB, --muted → #F9FAFB, --muted-foreground → #6B7280
   - --card → #FFFFFF, --accent → #F3F4F6
   - --radius → 0.75rem (12px, 保持不变)
   - 去掉 --highlight (不再需要橙色高亮)
 2. theme.css .dark 变量更新：
   - --background → #0A0A0A, --foreground → #FAFAFA
   - --card → #141414, --border → #262626
   - --primary → #FFFFFF, --primary-foreground → #000000
   - --muted → #1A1A1A, --muted-foreground → #A3A3A3
 3. tailwind.config.ts 添加：
   - fontFamily.brand: ['Space Grotesk', 'sans-serif']
   - fontFamily.mono: ['JetBrains Mono', 'monospace']
   - fontSize['2xs']: '0.625rem'
   - boxShadow.subtle 和 boxShadow.lift

 Phase 1: 共享骨架组件

 改动文件：
 - apps/web/src/modules/public/shared/components/NavBar.tsx — 重写为紧凑顶栏 (h-12, 黑白风格)
 - apps/web/src/modules/public/shared/components/TabBar.tsx — 重写移动端底栏样式
 - apps/web/src/modules/public/shared/components/PageHero.tsx — 改为左对齐 + font-brand 标题
 - apps/web/src/modules/public/shared/components/Footer.tsx — 简化为紧凑 footer
 - apps/web/src/modules/public/shared/components/MobilePageHeader.tsx — 统一紧凑头部
 - apps/web/src/modules/public/shared/components/EmptyState.tsx — 更新样式

 Phase 2: shadcn/ui 关键基础组件

 改动文件（packages/ui/src/）：
 - button.tsx — 新增 pill variant (rounded-full)，默认改为 rounded-md，primary 用黑色
 - card.tsx — padding 改为 p-3，圆角 rounded-lg
 - badge.tsx — 改为 text-[10px] font-bold uppercase tracking-wider rounded-md + 语义色
 variants
 - tabs.tsx — 改为灰底白色 active 的 segmented control 样式
 - dialog.tsx / drawer.tsx / sheet.tsx — 更新圆角和间距

 Phase 3: Events 模块（核心页面）

 改动文件：
 - EventCard.tsx / EventCardCompact.tsx — 按原型重写卡片（h-32 图片、p-3 内容、mono 元数据）
 - EventListWithFilters.tsx / EventsFiltersClient.tsx — 紧凑筛选栏
 - EventsTabs.tsx — segmented control 样式
 - EventHero.tsx / Hero.tsx — 按 event_detail.html 原型重写
 - EventInfoCard.tsx — sticky sidebar 样式
 - EventRegistrationCard.tsx — 黑色 CTA 按钮
 - EventActionSidebar.tsx — 紧凑 sidebar
 - EventStatsBar.tsx — 紧凑统计栏
 - MobileEventBottomActions.tsx / MobileCTA.tsx — 紧凑移动端操作栏
 - SectionCard.tsx — 统一 section 样式
 - Events 列表页 (apps/web/src/app/(public)/events/page.tsx)
 - Events 详情页 (apps/web/src/app/(public)/events/[eventId]/page.tsx)

 Phase 4: 其他公开页面

 按优先级逐个更新：
 1. 首页 — Home 模块下所有 section 组件
 2. Projects — ProjectCard、ProjectHero、ProjectSidebar 等
 3. Organizations — OrganizationPublicHomepage、OrganizationDiscovery 等
 4. Profile — ProfileHeader、各 Section 组件
 5. Tasks — TaskHall、TaskDetail 等
 6. Fast Intro / Intro / New Landing — 各 landing page section
 7. Blog / Changelog — 内容页样式

 Phase 5: 收尾

 - 删除不再使用的旧样式/变量
 - 确保所有页面在移动端/桌面端表现正常
 - 运行 pnpm lint:fix 和 pnpm type-check 确保无报错
 - 运行 pnpm build 确保构建通过

 验证方式

 1. pnpm type-check — 无 TypeScript 错误
 2. pnpm lint — 无 lint 错误
 3. pnpm build — 构建成功
 4. 手动检查核心页面：/, /events, /events/[id], /projects, /orgs, /u/[username]
 5. 移动端和桌面端分别检查响应式表现

 执行建议

 这个计划工作量很大（~100+ 文件），建议按 Phase 逐步推进，每个 Phase
 完成后验证一次再继续。Phase 0-2 是基础，改完后大量页面会自动跟着变（因为用了 shadcn
 token）。Phase 3 是视觉效果最明显的部分。Phase 4 可以后续分批做。

