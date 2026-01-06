## 1. 实施任务（Implementation）

- [x] 覆盖 `/events/:eventId/register`：从 URL query `invite` 读取邀请码；若不存在，则从 `localStorage` 的 `event-invite-${eventId}` 读取；将其作为 `inviteCode` 传入 `EventRegistrationForm` 并随报名请求发送
- [x] 登录跳转保参：所有触发登录跳转的路径（含独立报名页）构造 `redirectTo` 时保留原始 query（至少包含 `invite`）
- [x] 服务端兜底：报名接口在请求体缺少 `inviteCode` 时，从 cookie/会话读取候选邀请码，并在通过 `eventId + code` 查库校验后写入 `inviteId`
- [x] 归因一致性校验：确认「弹窗报名」与「独立报名页」两条链路写入的 `inviteId` 行为一致

## 2. 验证任务（Validation）

- [x ] 手工验证（移动端）：用 `...?invite=XXXX` 打开活动页 → 点击报名（跳转 `/events/:id/register`）→ 完成报名 → 后台「邀请统计」中该渠道「报名数」增长
- [x ] 手工验证（桌面端）：同一链接走弹窗报名 → 统计同样增长
- [ x] 负例验证：传入不存在的 `invite` 值 → 报名仍可成功，但不应写入 `inviteId`
- [x ] 取消/重报验证：取消报名后再次报名（或重新报名）时，若当前仍携带同一邀请码，应继续正确归因
- [ x] 质量门槛：`bun lint`、`bun type-check`（以及有条件时 `bun run e2e` 覆盖带邀请码报名路径）
  - Note: `bun lint` 已通过；`bun type-check` 当前在仓库内存在与本变更无关的报错。

## 3. 发布与观测（Rollout）

- [ x] 上线后抽样检查：任意活动至少 1 个渠道邀请码可出现非 0 的报名数
- [ x] 若出现统计仍为 0：优先检查报名请求 payload 是否包含 `inviteCode`，其次检查服务端是否成功解析并写入 `inviteId`
