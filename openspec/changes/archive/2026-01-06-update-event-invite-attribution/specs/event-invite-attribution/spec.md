# event-invite-attribution (Delta) Specification

## ADDED Requirements

### Requirement: 报名归因写入（inviteCode -> inviteId）
当用户报名活动时，系统 SHALL 在可校验的前提下将邀请码归因写入报名记录（`EventRegistration.inviteId`），以支撑邀请统计聚合。

#### Scenario: 通过带邀请码链接报名（弹窗或独立报名页）
- **GIVEN** 用户访问活动页面的 URL 包含 `?invite=CODE`
- **WHEN** 用户完成报名提交
- **THEN** 后端将 `CODE` 校验为该活动的有效 `EventInvite`
- **AND** 报名记录 `EventRegistration.inviteId` 被写入为对应 `EventInvite.id`

#### Scenario: 邀请码无效时不写入归因
- **GIVEN** 报名请求携带 `inviteCode=INVALID`
- **WHEN** 后端无法在该活动下查到对应 `EventInvite`
- **THEN** 报名仍可继续（不因邀请码失败而阻断）
- **AND** 报名记录不应写入 `inviteId`

### Requirement: 独立报名页携带邀请码
系统 SHALL 确保 `/events/{eventId}/register` 报名路径能够获取并携带邀请码，使报名请求体包含 `inviteCode`。

#### Scenario: URL query 存在 invite 参数
- **GIVEN** 用户打开 `/events/{eventId}/register?invite=CODE`
- **WHEN** 用户提交报名
- **THEN** 报名请求体包含 `inviteCode=CODE`

#### Scenario: URL query 不存在但本地已缓存
- **GIVEN** 用户此前访问过 `.../events/{eventId}?invite=CODE` 且已缓存邀请码
- **WHEN** 用户打开 `/events/{eventId}/register` 并提交报名
- **THEN** 报名请求体包含 `inviteCode=CODE`

### Requirement: 登录跳转不丢失邀请码参数
当用户未登录需要跳转登录页时，系统 SHALL 保留原始 `invite` 参数，使登录成功回跳后仍可完成归因。

#### Scenario: 未登录用户通过邀请码链接进入并报名
- **GIVEN** 未登录用户访问 `.../events/{eventId}?invite=CODE`
- **WHEN** 系统要求登录并执行跳转
- **THEN** `redirectTo` 保留原始 query（至少包含 `invite=CODE`）
- **AND** 登录回跳后仍可在报名请求中发送 `inviteCode=CODE`

### Requirement: 服务端兜底归因（cookie/会话）
当报名请求体未包含 `inviteCode` 时，服务端 SHALL 尝试从 cookie/会话读取候选邀请码，并在校验为有效邀请码后写入 `inviteId`。

#### Scenario: 请求体缺失 inviteCode 但服务端可兜底
- **GIVEN** 报名请求体不包含 `inviteCode`
- **AND** cookie/会话中存在该活动的候选邀请码 `CODE`
- **WHEN** 后端校验 `CODE` 为该活动有效 `EventInvite`
- **THEN** 报名记录写入对应的 `inviteId`

