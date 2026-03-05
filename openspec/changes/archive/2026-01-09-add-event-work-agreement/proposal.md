# Change: Add two-stage agreements (registration + submission)

## Why
活动流程需要两阶段协议：报名阶段签署《参赛协议》，提交阶段签署《作品授权协议》（并选择是否授权社区用于展示/投票/评选）。两份协议均由活动方在管理后台配置（Markdown），前端以弹窗形式渲染供用户查看。

## What Changes
- 活动管理后台提供两份协议配置（Markdown），分别用于报名与提交阶段：
  - 《参赛协议》：报名页面展示并要求用户同意后才能完成报名
  - 《作品授权协议》：作品提交页面的「授权说明」模块中提供查看入口，并通过单选项让用户选择是否授权
- 提供默认模板：活动可直接使用默认模板，或为单个活动覆盖为自定义 Markdown 协议
- 作品提交页「授权说明」模块规则：
  - 保持现有单选结构（同意/暂不同意），默认选中“同意授权”
  - “同意授权”文案说明其参与展示/投票/评选，并提供“查看《作品授权协议》”入口（弹窗，Markdown 渲染）
  - “暂不同意”文案明确后果：作品不参与展示、投票及评选（仅提交者/组织者可见），并用 warning/提示条强化
  - 选择“同意授权”即视为同意《作品授权协议》；选择“暂不同意”仍可提交但按上述规则处理

## Impact
- Affected capability: `event-work-agreement` (new)
- Affected code (expected):
  - 活动管理后台：报名协议配置 + 作品授权协议配置（不同入口）
  - 活动读取/更新接口（event API payload for agreement config）
  - 作品提交表单：授权说明模块文案与协议弹窗（event submissions UI）
  - 活动报名页面与报名表单（public registration UI）
- Compatibility: 现有活动默认使用内置模板；不引入新表/新字段迁移（复用现有活动 JSON 配置与提交授权字段语义）

## Non-Goals
- 不实现多语言协议内容
- 不新增用户“已阅读/已同意协议”的审计记录与版本回溯能力
