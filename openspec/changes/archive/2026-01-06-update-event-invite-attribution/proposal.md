# Change: 更新活动邀请码归因（邀请统计不再恒为 0）

## Why（为什么要改）
目前「活动管理 → 邀请统计」中的各渠道「报名数 / 新注册」一直为 0。排查链路后确认统计依赖 `EventRegistration.inviteId` 与 `EventInvite` 的关联；当报名请求未携带 `inviteCode` 时，后端无法写入 `inviteId`，导致 `event_invite.registrations` 始终为空，统计自然为 0。

复现路径（典型）：
- 用户通过带 `?invite=XXXX` 的分享链接打开活动页
- 在移动端点击报名会跳转到 `/events/:eventId/register`
- 独立报名页未把邀请码传入报名表单，报名请求缺少 `inviteCode`
- 后端无法解析并写入 `EventRegistration.inviteId`

## What Changes（改什么）
- 保证 **所有报名入口** 在提交报名请求时都能携带邀请码（`inviteCode`），至少覆盖移动端独立报名页 `/events/:eventId/register`。
- 保证 **登录跳转** 不丢失 `invite` 参数（`redirectTo` 保留原始 query）。
- 增加 **服务端兜底归因**：当请求体未包含 `inviteCode` 时，从 cookie/会话读取并尝试归因（仅在能校验为有效邀请码时写入）。

## Non-Goals（不做什么）
- 不调整「新注册」的业务口径（当前为 10 分钟窗口启发式）。
- 不重做邀请统计页面 UI 与表结构。
- 不对历史数据做回填（本变更只保证新产生的报名可归因）。

## Impact（影响范围）
- Affected specs（新增能力）：`event-invite-attribution`（本次 change 仅新增/定义该能力的 delta）
- Affected code（实现阶段会涉及的关键位置）：
  - 前端：`src/app/(public)/[locale]/events/[eventId]/register/EventRegistrationPage.tsx`
  - 前端：`src/app/(public)/[locale]/events/[eventId]/hooks/useUnifiedEventRegistration.ts`
  - 前端：`src/app/(public)/[locale]/events/[eventId]/components/EventLayout.tsx`（现有缓存逻辑对齐）
  - 后端：`src/server/routes/events/registrations.ts`（`inviteCode -> inviteId` 写入点）
  - 统计：`src/lib/database/prisma/queries/event-invites.ts`
- Data / DB：不需要新增表或迁移；可能新增 cookie 键（归因兜底）。

## Risks & Mitigations（风险与应对）
- 风险：cookie/本地缓存可能被篡改或过期。
  - 应对：服务端必须以 `eventId + code` 查库校验；查不到则忽略，不写入归因。
- 风险：登录跳转链路不同导致 query 丢失。
  - 应对：统一构造 `redirectTo` 时保留原始 query（包含 `invite`），并在登录回跳后仍可读取。

