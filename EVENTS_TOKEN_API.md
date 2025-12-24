# Events Token API 使用说明（含不同活动示例）

- **概览**  
  Events Token 允许受信任的第三方工具以“个人发起”的方式创建活动，不需共享账号密码。所有请求均发送到 `POST /api/events`，并在 Header 中携带 `Authorization: EventsToken <token>`。
- **Token 获取**  
  1. 登录后台 → 账户设置 → 安全 → “Events Token”。  
  2. 若未生成过，点击“生成 Token”，值只显示一次，请立即复制。  
  3. 模块会显示 token 尾号、创建/最近使用时间以及限制提醒（5 分钟最多 60 次请求）。  
  4. 可随时“重新生成”或“立即失效”，旧 token 即刻不可用。
- **通用请求格式**  

```
POST https://your-domain/api/events
Authorization: EventsToken evt_xxxxx
Content-Type: application/json
```

  - Body 按 `src/server/routes/events.ts` 中 `eventSchema` 填写；所有时间必须是 ISO 8601 字符串。  
  - Token 调用仅允许“个人发起”，`organizationId` 会被忽略并返回 400。  
  - 其余字段校验（内容审核、时间顺序、线下地址、票种等）与 App 内创建保持一致。  
  - 成功创建后，响应体 `data` 中会附带 `eventUrl`，即新活动的完整访问链接，方便第三方直接跳转。

# Events Token API 字段说明

## Meetup (线下活动)

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 活动标题，出现在列表和详情页，需通过内容审核。 |
| `richContent` | 是 | HTML 正文；可嵌入图片 `<img>` 等，但需使用可访问的 CDN URL 并通过内容审核/图片审核。 |
| `type` | 是 | 固定为 `"MEETUP"`。 |
| `startTime` | 是 | ISO8601 UTC 时间，必须早于 `endTime`。 |
| `endTime` | 是 | ISO8601 UTC 时间，必须晚于 `startTime`。 |
| `isOnline` | 是 | `false` 表示线下。为 `false` 时 `address` 变为必填。 |
| `address` | 条件必填 | 线下活动地址，`isOnline: false` 时必填。 |
| `shortDescription` | 否 | ≤200 字符摘要，用于卡片显示。 |
| `status` | 否 | `"PUBLISHED"`（默认）或 `"DRAFT"`。草稿不会发送通知。 |
| `tags` | 否 | 标签数组。 |
| `ticketTypes` | 否 | 票种数组，决定报名流程的票务信息（`name` 必填，其余可选）。 |
| `questions` | 否 | 报名表自定义问题数组，字段含 `question`、`type`、`required` 等。 |

示例：

```json
{
  "title": "API 自动化 Meetup",
  "richContent": "<p>我们会分享如何使用 Events Token。</p>",
  "type": "MEETUP",
  "isOnline": false,
  "address": "上海市徐汇区某路 123 号",
  "startTime": "2025-05-10T06:00:00.000Z",
  "endTime": "2025-05-10T08:00:00.000Z",
  "status": "PUBLISHED",
  "shortDescription": "自动化创建示例",
  "tags": ["automation"],
  "ticketTypes": [
    { "name": "普通票", "price": 0, "maxQuantity": 80 }
  ],
  "questions": [
    { "question": "你主要关注的主题？", "type": "TEXT", "required": false }
  ]
}
```

## Hackathon (含作品提交)

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` / `richContent` / `startTime` / `endTime` / `shortDescription` | 是 | 与 Meetup 相同。 |
| `type` | 是 | 固定为 `"HACKATHON"`。 |
| `isOnline` | 是 | true/false；决定 `address` 或 `onlineUrl` 的必填情况。 |
| `onlineUrl` | 否 | `isOnline: true` 时可提供会议链接，必须是合法 URL。 |
| `requireProjectSubmission` | 否 | `true` 表示参赛者必须提交作品，会自动启用 `submissionsEnabled`。 |
| `submissionsEnabled` | 否 | 控制作品提交流程；黑客松默认为 true。 |
| `hackathonConfig` | 否 | 队伍配置，如 `minTeamMembers`、`maxTeamMembers`、`allowSolo` 等。 |
| `registrationFieldConfig` | 否 | 报名表模板（`template: FULL/MINIMAL/CUSTOM`），控制字段开关。 |
| `submissionFormConfig` | 否 | 作品提交表单定义，`fields` 中包含 `key`、`label`、`type`、`required`、`order` 等。 |
| `tags` / `questions` / `ticketTypes` | 否 | 与 Meetup 相同。 |

示例：

```json
{
  "title": "API Hackathon 2025",
  "richContent": "<p>48 小时开发挑战，支持远程参赛。</p>",
  "type": "HACKATHON",
  "isOnline": true,
  "onlineUrl": "https://meeting.example.com/hackathon",
  "startTime": "2025-07-01T00:00:00.000Z",
  "endTime": "2025-07-03T00:00:00.000Z",
  "status": "PUBLISHED",
  "requireProjectSubmission": true,
  "shortDescription": "通过 API 创建的黑客松",
  "hackathonConfig": {
    "minTeamMembers": 1,
    "maxTeamMembers": 5,
    "allowSolo": true
  },
  "registrationFieldConfig": {
    "template": "FULL"
  },
  "submissionFormConfig": {
    "fields": [
      { "key": "repo", "label": "GitHub 仓库", "type": "url", "required": true, "order": 1 },
      { "key": "demo", "label": "Demo 视频链接", "type": "url", "required": false, "order": 2 }
    ]
  },
  "tags": ["hackathon", "remote"]
}
```

> 注意：
> - Token 调用仅支持“个人发起”，传入 `organizationId` 会返回 400。
> - 所有时间字段必须使用 ISO8601 字符串，系统按 UTC 存储。
> - 内容和图片都会走审核；被拒会返回 400 并附 `details`。
> - 单个 token 5 分钟最多 60 次请求，超限返回 429，需按 `Retry-After` 重试。
