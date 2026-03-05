# Design: 活动邀请码归因（Invite Attribution）

## 背景与现状
当前邀请统计的数据来源为：
- `EventInvite`（邀请码/渠道码）
- `EventRegistration.inviteId`（报名记录与邀请码的外键关联）

统计聚合逻辑（现状）：
- 「报名数」= `event_invite.registrations.length`
- 「新注册」= `|registeredAt - user.createdAt| <= 10min` 的报名者数量（启发式）

导致统计恒为 0 的关键点在于：某些报名入口没有把 `inviteCode` 带到报名请求体中，使得后端无法把它解析为 `inviteId` 并写入报名表。

## 目标
1. 用户通过带 `?invite=CODE` 的链接进入后，无论走弹窗报名还是独立报名页报名，都能把该邀请码归因到 `EventRegistration.inviteId`。
2. 登录跳转不丢邀请码参数。
3. 提供服务端兜底，降低前端分支遗漏导致归因丢失的概率。

## 设计方案

### 方案 A（必须）：前端独立报名页补齐 inviteCode 传递
在 `/events/:eventId/register` 页面：
1. 读取 `invite` query 参数作为首选邀请码。
2. 若 query 不存在，则读取 `localStorage` 的 `event-invite-${eventId}`（与活动详情页对齐）。
3. 将得到的值作为 `inviteCode` 传入 `EventRegistrationForm`；表单提交时会把 `inviteCode` 写进报名请求 body。

### 方案 B（必须）：登录跳转保留 query
当用户未登录需要跳转登录页时，`redirectTo` 必须包含原始 path + query（至少包含 `invite`）。这样登录成功回跳后仍能恢复邀请码，并参与方案 A 的读取逻辑。

### 方案 C（推荐兜底）：服务端从 cookie/会话补齐 inviteCode
服务端报名接口处理顺序：
1. 若 body 中存在 `inviteCode`：按现有逻辑解析并写入 `inviteId`。
2. 若 body 中不存在 `inviteCode`：尝试从 cookie/会话读取「最近一次该活动的邀请码」作为候选值。
3. 对候选值执行校验：必须能通过 `eventId + code` 查到 `EventInvite` 才写入 `inviteId`；查不到则忽略（不阻断报名）。

兜底信息写入策略（建议）：
- 在用户访问活动详情页且 URL 带 `invite` 时写 cookie（带 eventId 维度、合理 TTL）。
- cookie 只存邀请码字符串，不存用户隐私信息。

## 关键交互时序（简化）

### 带邀请码 → 独立报名页 → 报名成功
1. 用户打开 `/{locale}/events/{eventId}?invite=CODE`
2. 页面缓存邀请码（localStorage/cookie）
3. 移动端点击报名跳转 `/{locale}/events/{eventId}/register`（保留 query 或由缓存兜底）
4. 报名请求携带 `inviteCode=CODE`
5. 服务端解析到 `inviteId`，写入 `EventRegistration.inviteId`
6. 邀请统计聚合可见非 0

### 带邀请码但请求体缺失 → 服务端兜底
1. 报名请求体缺失 `inviteCode`
2. 服务端从 cookie/会话读取候选邀请码
3. 校验有效后写入 `inviteId`

## 取舍与边界
- 本次不调整「新注册」口径；若后续需要更准确的“带来注册”统计，应新增显式归因事件/表，而不是依赖 10 分钟窗口。
- cookie/本地缓存属于弱信号，必须以数据库校验为准，避免无效值污染归因。

