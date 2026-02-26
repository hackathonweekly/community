# Design: two-stage agreements (registration + submission)

## Goals
- 让组织者能为每个活动分别配置两份协议（Markdown）：报名阶段《参赛协议》、提交阶段《作品授权协议》。
- 报名阶段：用户必须同意《参赛协议》才能完成报名。
- 提交阶段：在「授权说明」模块中提供协议查看入口与授权选择；默认同意授权，允许选择暂不同意（影响公开展示/投票/评选）。
- 保持实现简单：不新增用户“同意协议”的审计记录体系，不引入新表。

## Data model
- 两份协议内容均为 Markdown 文本，并各自支持活动级覆盖；未配置时使用默认模板。
- 《参赛协议》的同意状态仅用于前端报名提交流程控制，不落库。
- 《作品授权协议》的授权选择复用现有 `communityUseAuthorization`/`project.communityUseAuth` 语义，决定作品是否参与展示/投票/评选。

## Storage approach
为避免新增 Prisma 字段与数据库迁移，优先复用既有活动 JSON 配置字段：
- 《参赛协议》：扩展 `Event.registrationFieldConfig`（或其等价配置）以保存 `participationAgreementMarkdown`
- 《作品授权协议》：扩展 `Event.submissionFormConfig.settings` 以保存 `workAuthorizationAgreementMarkdown`

## UI/UX
- 管理后台提供两个配置入口（位置不同）：
  - 报名配置区域：编辑《参赛协议》（Markdown），支持恢复默认模板与预览（Markdown 渲染）
  - 作品提交配置区域：编辑《作品授权协议》（Markdown），支持恢复默认模板与预览（Markdown 渲染）
- 报名页：
  - 提供“查看《参赛协议》”入口（弹窗，Markdown 渲染）
  - 必须勾选“我已阅读并同意《参赛协议》”才能提交报名
- 作品提交页「授权说明」模块：
  - 保持现有单选结构，默认同意授权
  - 在“同意授权”选项内提供“查看《作品授权协议》”入口（弹窗）
  - “暂不同意”用 warning/提示条明确后果：作品不参与展示/投票/评选（仅提交者/组织者可见）

## Trade-offs
- “不同意授权仍可提交但不可公开参与”需要服务端在公开列表、投票与评选相关查询/操作中排除这些作品；本变更通过复用既有字段实现，不新增审计记录。
- 如后续需要更强合规能力，可扩展为：保存协议版本快照与同意时间（单独落库），并在关键动作（提交/编辑/投票）上执行版本校验。
