## 1. Spec & Contracts
- [ ] 1.1 扩展 `SubmissionFormConfig` 类型，新增基础字段配置结构（`tagline` / `demoUrl` / `attachments`）。
- [ ] 1.2 更新服务端 `submissionFormConfig` 的 zod schema 以接受新结构，并保持向后兼容。
- [ ] 1.3 更新 `normalizeSubmissionFormConfig`：运行时过滤非法字段，定义兼容优先级（新配置优先，旧 `settings.attachmentsEnabled` 兜底）。

## 2. Admin 配置入口（活动编辑页）
- [ ] 2.1 在 `SubmissionFormConfigEditor` 增加「基础字段」配置区：可编辑 label/desc/placeholder、必填/显示开关。
- [ ] 2.2 更新 `SubmissionFormConfigSummary`：展示基础字段配置摘要（如：附件必填/隐藏等）。

## 3. 提交/编辑作品表单 UI
- [ ] 3.1 `EventSubmissionForm` 使用配置渲染基础字段 label/desc/placeholder 与必填标识。
- [ ] 3.2 当字段被禁用（enabled=false）时，UI 不展示且提交 payload 不包含该字段。
- [ ] 3.3 当字段被设为必填（required=true）时，前端校验与提示信息符合配置。

## 4. 服务端校验与写入
- [ ] 4.1 创建/更新 submission 时，按活动配置校验 `tagline` / `demoUrl` / `attachments` 的必填规则。
- [ ] 4.2 保持既有规则：`tagline` 长度上限 100、`demoUrl` 为合法 URL（若有值）。

## 5. Validation
- [ ] 5.1 为配置归一化与必填逻辑补充单测（若当前模块已有相关测试入口）。
- [ ] 5.2 `bun lint` 与 `bun type-check` 通过。

