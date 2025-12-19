# 组织成员邀请流程（当前实现）

本文档梳理当前“邀请成员加入组织”的代码入口、数据模型与端到端流程，包含两条主链路：

- **管理员直接邀请（Invitation）**：生成邀请链接 / 发邮件 / 站内通知，受邀者接受后立即成为组织成员。
- **成员推荐码（Referral Request）**：普通成员生成推荐码链接，候选人提交加入申请，管理员审核通过后成为组织成员。

> 代码以 Next.js App Router + Hono `/api` 服务为主，组织与邀请能力由 Better Auth `organization()` 插件提供。

## 关键代码入口（Code Map）

### 后端（Hono API）

- 邀请（管理员创建/列表/接受）：`src/server/routes/organizations/router.ts`
  - `POST /api/organizations/:slug/invitations`
  - `GET /api/organizations/:slug/invitations`
  - `POST /api/organizations/invitations/:invitationId/accept`
- 成员推荐码邀请：`src/server/routes/organizations/router.ts`
  - `POST /api/organizations/member-invitations`
  - `GET /api/organizations/invitation-requests/:code`
- 申请加入 + 管理员审核：`src/server/routes/organizations/router.ts`
  - `POST /api/organizations/applications`
  - `PUT /api/organizations/applications/:applicationId/review`

### 前端（页面/组件）

- 管理员邀请入口（组织后台成员管理）
  - 生成/发送邀请：`src/modules/dashboard/organizations/components/InviteMemberForm.tsx`
  - 邀请列表/撤回：`src/modules/dashboard/organizations/components/OrganizationInvitationsList.tsx`
  - 调用 API：`src/modules/dashboard/organizations/lib/api.ts`
- 公共邀请入口（组织详情页跳转）
  - 邀请页面：`src/app/(public)/[locale]/orgs/[slug]/invite-member/page.tsx`
  - 问卷 + 生成链接：`src/modules/public/organizations/components/OrganizationMemberInvitationForm.tsx`
- 受邀者处理邀请
  - 邀请详情页：`src/app/(app)/app/(organizations)/(without-organization-slug)/organization-invitation/[invitationId]/page.tsx`
  - 接受/拒绝弹窗：`src/modules/dashboard/organizations/components/OrganizationInvitationModal.tsx`
  - 完善资料页：`src/app/(app)/app/(organizations)/(without-organization-slug)/organization-invitation/[invitationId]/complete-profile/page.tsx`
  - 完善资料表单：`src/modules/dashboard/organizations/components/InvitationProfileCompletionForm.tsx`
- 推荐码候选人申请加入
  - 申请页面：`src/app/(public)/[locale]/orgs/[slug]/apply/page.tsx`
  - 申请表单：`src/modules/public/organizations/components/OrganizationApplicationForm.tsx`

### Better Auth（组织邀请邮件）

- 插件配置与发邀请邮件：`src/lib/auth/auth.ts`
  - `organization({ sendInvitationEmail })`
  - 使用邮件模板 `organizationInvitation`
  - placeholder 域名邀请不会触发发信（用于“仅链接邀请”）

## 数据模型与状态

### Invitation（管理员直接邀请）

Prisma 模型：`src/lib/database/prisma/schema.prisma` 中 `model Invitation`

关键字段：

- `id`：邀请 ID（也是链接中的关键标识）
- `organizationId`
- `email`：Better Auth 需要；纯链接邀请会写入 placeholder 邮箱
- `targetUserId?`：站内邀请/定向邀请（限制仅该用户可接受）
- `status`：`pending | accepted | rejected | canceled/cancelled ...`
- `expiresAt`
- `metadata Json?`：业务扩展字段（见下）

metadata 当前主要承载：

- `originalEmail`：若使用 placeholder 邮箱，此处记录真实邮箱（如有）
- `linkType`：`link | email | in-app | email+in-app | direct-invite ...`
- `notificationSent`：是否创建过站内通知（仅在创建邀请时写入）
- `pendingProfileUserId / pendingProfileMissing`：受邀者资料不完整时的“待完善”状态
- `claimedByUserId / claimedEmail / claimedAt`：通用链接被某用户“认领”后的记录

### Member（入会记录）

Prisma 模型：`src/lib/database/prisma/schema.prisma` 中 `model Member`

- `invitationId?`：通过某次 Invitation 加入时关联到对应邀请（由 Better Auth/流程产生）
- `invitedBy?`：邀请人（可用于审计/追踪）

### OrganizationInvitationRequest（成员推荐码）

Prisma 模型：`src/lib/database/prisma/schema.prisma` 中 `model OrganizationInvitationRequest`

- `code`：推荐码（URL query `invited-code`）
- `status`：`PENDING | APPLICATION_SUBMITTED | APPROVED | REJECTED ...`
- `inviterId`：推荐人
- `inviteeName / invitationReason / eligibilityDetails`：推荐问卷内容
- `applicationId?`：候选人提交申请后关联

### OrganizationApplication（候选人加入申请）

Prisma 模型：`src/lib/database/prisma/schema.prisma` 中 `model OrganizationApplication`

- `status`：`PENDING | APPROVED | REJECTED`
- `reason`：拼接后的申请理由（包含自述、贡献、线下活动、邀请人、可访谈时间等）

## 流程 A：管理员直接邀请（Invitation）

### A1. 管理员创建邀请

入口 1（组织后台）：

- UI：`InviteMemberForm`（链接/邮箱/站内邀请）
- API：`POST /api/organizations/:slug/invitations`

后端逻辑（`src/server/routes/organizations/router.ts`）：

1. 校验当前用户是组织 `owner/admin`。
2. 可选去重：
   - 定向邀请：同 `targetUserId` 的未过期 `pending` 邀请会被拒绝（409）。
   - 邮箱邀请：同 `email` 的未过期 `pending` 邀请会被拒绝（409）。
3. 调用 Better Auth：`auth.api.createInvitation(...)` 创建 `Invitation`。
4. 写入 `Invitation.metadata`（linkType、originalEmail、notificationSent 等）。
5. 若 `targetUserId` 存在：写入站内通知 `ORGANIZATION_MEMBER_INVITED`，`actionUrl` 指向 `/app/organization-invitation/:id`。

> 邮箱邀请的发送由 Better Auth `organization.sendInvitationEmail` 完成：`src/lib/auth/auth.ts`（遇到 placeholder 邮箱则不发信）。

入口 2（公共邀请页，管理员走“直邀”模式）：

- UI：`OrganizationMemberInvitationForm`（问卷）
- API：`POST /api/organizations/member-invitations`
  - 若当前用户是 `owner/admin/manager`：直接创建 `Invitation`（`linkType: direct-invite`），返回 `invitationUrl`。

### A2. 受邀者打开邀请链接

邀请链接形态：

- 通用邀请链接：`/app/organization-invitation/:invitationId`（需要登录）
- 邮件中的登录/注册链接：`/auth/login?invitationId=...&email=...` 或 `/auth/signup?...`
  - 登录成功后会跳转到 `/app/organization-invitation/:invitationId`

页面加载（`src/app/(app)/.../organization-invitation/[invitationId]/page.tsx`）：

1. 读取 Invitation（`getInvitation` -> `getInvitationById`）。
2. 若未登录：跳转 `/auth/login` 并带 `redirectTo=/app/organization-invitation/:id`。
3. 计算是否允许操作（`canRespond`）：
   - 过期/非 pending：不可操作
   - 若 `linkType` 为 `in-app` / `email+in-app`：限制仅 `targetUserId` 可接受
   - 若已是组织成员：不可操作
4. 渲染 `OrganizationInvitationModal`，提供“接受/拒绝”按钮。

### A3. 接受邀请（含资料完整性门槛）

点击“接受”调用：

- API：`POST /api/organizations/invitations/:invitationId/accept`

后端逻辑（`src/server/routes/organizations/router.ts`）：

1. 校验 Invitation 存在、`pending` 且未过期。
2. 对 `in-app`/`email+in-app` 邀请做收件人限制（`targetUserId` 必须等于当前用户）。
3. **资料完整性校验**：
   - 校验项见：`src/features/profile/invitation-requirements.ts`
   - 若缺失：写入 `user.pendingInvitationId` + `invitation.metadata.pendingProfile*`，返回 `{ status: "needs_profile", missingFields }`
4. 对“通用链接 + placeholder 邮箱”的邀请：
   - 用当前用户邮箱“认领”该 Invitation（写入 `claimed*` 元数据，并把 `invitation.email` 更新为真实邮箱）
5. 调用 Better Auth：`auth.api.acceptInvitation({ invitationId })`
6. 清理 `user.pendingInvitationId`；若用户 `membershipLevel` 为 `VISITOR`，自动升级为 `MEMBER`。
7. 清理 `invitation.metadata.pendingProfile*` 后返回 `{ status: "accepted", organizationSlug }`。

完善资料页（`.../complete-profile/page.tsx`）会引导用户提交 `/api/profile/update`，随后自动再次尝试 accept。

### A4. 拒绝/撤回邀请

- 受邀者拒绝：`authClient.organization.rejectInvitation({ invitationId })`（UI 在 `OrganizationInvitationModal`）
- 管理员撤回：`authClient.organization.cancelInvitation({ invitationId })`（UI 在 `OrganizationInvitationsList`）

## 流程 B：成员推荐码（Referral Request → Application → Review）

### B1. 普通成员生成推荐码链接

入口：

- UI：`OrganizationMemberInvitationForm`（问卷）
- API：`POST /api/organizations/member-invitations`

后端逻辑（`src/server/routes/organizations/router.ts`）：

1. 校验当前用户是组织成员（任意 role）。
2. 若非管理员角色：创建 `OrganizationInvitationRequest`，生成 `code`。
3. 返回申请链接：`/orgs/:slug/apply?invited-code=:code`

### B2. 候选人提交加入申请

入口：

- 页面：`/orgs/:slug/apply?invited-code=...`
- API：`POST /api/organizations/applications`

后端逻辑要点：

1. 校验候选人非组织成员、没有重复 `PENDING` 申请。
2. 若携带 `invitationRequestCode`：
   - 校验 code 存在、属于该组织、状态为 `PENDING`
   - 将推荐码状态更新为 `APPLICATION_SUBMITTED` 并关联 `applicationId`
3. 通知组织管理员（站内通知 + 邮件）。

### B3. 管理员审核申请

入口：

- API：`PUT /api/organizations/applications/:applicationId/review`

后端逻辑要点：

1. 校验审核人是组织 `owner/admin`。
2. 更新申请状态 `APPROVED/REJECTED`。
3. 若 `APPROVED`：创建 `Member`（幂等处理唯一约束）。
4. 若关联了推荐码：同步将 `OrganizationInvitationRequest.status` 更新为 `APPROVED/REJECTED`。
5. 通知申请人审核结果（NotificationService）。

## 建议（针对当前实现的可改进点）

1. **邀请元数据写入一致性**：接受邀请流程里会多次更新 `Invitation.metadata`，建议保持“同一个请求内的 metadata 变量为最新”，避免覆盖写导致信息丢失；并可考虑把清理逻辑与 accept 结果写入放在更清晰的顺序里。
2. **权限模型统一**：目前“管理员”在不同入口（后台直邀 vs 公共问卷直邀）使用的 role 集合不完全一致（是否包含 `manager`）；建议明确组织角色枚举与权限矩阵，并在 API 层统一校验集合。
3. **可观测性/审计**：建议在邀请被接受/拒绝/撤回时写入更明确的审计字段或事件（例如记录邀请来源、claim 行为、接受者用户 ID），便于后续运营排查。
4. **反滥用策略**：通用链接（link/direct-invite）可被转发，建议在后台默认使用定向邀请（targetUserId）或邮箱邀请，并对“通用邀请链接”的创建频率、有效期、撤回入口做更明显提示。
5. **减少重复请求**：公共邀请页与申请页目前会多次请求同一组织信息（包含成员列表）；可考虑增加“仅返回必要字段”的轻量 endpoint，或在页面层做缓存/合并请求。

