# UI Refactor Notes

## 已修复问题

- 修复 `apps/web/src/app/(main)/(public)/wechatpay-test/page.tsx` 中 `generateMetadata({}: {})` 的 Biome lint 错误（空对象参数 + 禁用 `{}` 类型）。
- 修复 `apps/web/src/modules/dashboard/organizations/components/OrganizationMembersAdmin.tsx` 中无意义 Fragment 的 Biome lint 错误。
- 统一 `events` 相关移动端操作文案，移除 emoji 前缀，保证 Modern Editorial 的文案一致性。
- 重构 `fast-intro`、`intro`、`introppt` 中遗留的高饱和渐变区块（`ContactSection`、`WhoWeAreSection`、`SuccessStoriesSection`、`PartnershipModes`、`PartnershipValue`、`CommunityAtmosphereSection`、`DifferentiationSection`、`PainPointsSection`、`ResultsSection`），统一为黑白灰紧凑卡片风格。
- 修复 `changelog` 里 `text-highlight` / `border-highlight` 失效样式，改为 token 驱动的时间标签与卡片样式。
- 完成 `blog` 列表页、`PostListItem`、`PostContent` 的 editorial 风格收敛（`font-brand` 标题、mono 元信息、紧凑卡片密度）。
- 优化 `EventListWithFilters` 清空筛选行为：清空时自动收起高级筛选面板，避免状态残留造成认知负担。
- 第二轮优先级重构已覆盖核心页面：`events` 卡片状态样式、`projects` 筛选/卡片/高级筛选、`tasks`（Tabs/Hall/MyTasks/Detail）主视图、`notifications` 消息中心、`me` 页面分区标题，以及 `NavBar`/`TabBar` 视觉密度统一。
- 第三轮补充重构（针对“仅改颜色、未改组件密度”的反馈）：`events/projects/tasks/notifications/me/navbar/tabbar` 进一步统一为 `rounded-lg + p-3 + gap-4` 的紧凑布局；重点下调了卡片内边距、筛选器高度、Tab/底栏尺寸和按钮字号，减少了历史页面中的大间距与高饱和状态块。
- `EventRegistrationCard`、`Hero`、`MobileEventBottomActions`、`EventActionSidebar` 的移动端操作区进一步扁平化（去高饱和提示底色、降低按钮高度、统一边框和字重层级），与 `ui-style.zh.mdx` 的高密度要求保持一致。
- `ProjectCard` 结构重排：封面区 + `p-3` 内容区 + `font-mono` 元数据区 + 紧凑作者区，避免旧版 `p-4`/`text-lg` 带来的“卡片过松散”问题。
- `TaskHall` / `MyTasks` / `TaskDetail` 重构为统一卡片密度，统计区和筛选区改为紧凑卡片，不再使用大标题+大留白的旧模板。
- 根据反馈再次重构 `/notifications`：消息列表卡片切换到 `rounded-2xl + p-3`、动作按钮改为 pill/outline-pill、元信息改为 `font-mono`、图标从 emoji 改为统一线性图标体系，整体与 `STYLE_GUIDE.md` 对齐。

## 后续可继续优化的建议

- 目前多个 legacy landing 组件仍保留较重视觉效果（渐变、大阴影、装饰层）；建议后续继续收敛到统一的「黑白灰 + 紧凑」体系。
- 活动详情页 (`Hero` / `EventLayout`) 的桌面与移动区块可进一步合并，减少重复按钮逻辑，降低维护成本。
- `events` 过滤器在移动端和桌面端存在两套实现（`EventListWithFilters` 与 `EventsFiltersClient`）；建议后续整合为一套共享逻辑。
- 建议补充 Playwright 关键路径截图回归（`/`, `/events`, `/events/[id]`, `/projects`, `/orgs`, `/u/[username]`）作为 UI 重构后的基线。
- 建议补充 Storybook / visual snapshot 用例，覆盖 `badge/button/card/tabs/dialog/sheet` 等基础组件，降低后续 token 调整的回归风险。
- `tasks` 与 `events` 详情页仍保留部分旧逻辑 UI（例如同一语义操作在不同 breakpoint 的按钮实现分叉）；建议后续按“一个语义一个组件”继续收敛，减少样式漂移和维护成本。
