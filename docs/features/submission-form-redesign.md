# 作品提交表单重构需求文档

## 一、背景

### 现状问题
1. 当前作品提交表单分为 4 步，但总共只有 8 个字段，过度设计
2. 编辑作品时需要来回切换步骤，体验不好
3. 无法自定义提交时需要收集的信息，每次活动可能需要不同的字段
4. 黑客松功能目前只能用于 HACKATHON 类型活动，希望普通活动也能使用

### 目标
1. 简化作品提交流程，改为单页表单
2. 支持管理员自定义作品提交时需要收集的问题
3. 让任何类型的活动都可以开启作品提交功能

---

## 二、功能设计

### 2.1 作品提交表单（用户端）

#### 表单布局（单页）

```
┌─────────────────────────────────────────────────────────┐
│  基础信息                                                │
│  ├── 作品名称 *                                          │
│  ├── 一句话介绍 * (10-100字)                             │
│  ├── 项目链接 (选填)                                     │
│  └── 作品描述 (选填，富文本)                              │
├─────────────────────────────────────────────────────────┤
│  补充信息（根据活动配置动态渲染，可能为空）                  │
│  ├── [自定义字段1] 如：智能体名称 *                       │
│  ├── [自定义字段2] 如：智能体发布链接 *                    │
│  ├── [自定义字段3] 如：应用商店截图 *                      │
│  ├── [自定义字段4] 如：邮寄地址 *                         │
│  └── [自定义字段5] 如：产品反馈 (选填)                    │
├─────────────────────────────────────────────────────────┤
│  团队成员                                                │
│  ├── 队长 (默认当前用户)                                  │
│  └── 队员 (可添加多人)                                   │
├─────────────────────────────────────────────────────────┤
│  附件上传                                                │
│  └── 支持拖拽上传，显示上传进度                           │
├─────────────────────────────────────────────────────────┤
│  ☑ 授权社区用于宣传                                      │
├─────────────────────────────────────────────────────────┤
│  [清除草稿]                              [提交作品]      │
└─────────────────────────────────────────────────────────┘
```

#### 功能特性
- 自动保存草稿（debounce 1秒）
- 表单验证（提交时统一校验，显示所有错误）
- 附件上传进度提示
- 编辑模式复用同一表单

### 2.2 自定义问题配置（管理端）

#### 配置界面位置
活动编辑页面 → 作品提交设置

#### 配置功能
1. **添加字段**：点击添加新的自定义字段
2. **编辑字段**：配置字段属性
3. **删除字段**：移除不需要的字段
4. **排序字段**：拖拽调整字段顺序
5. **预览效果**：实时预览表单效果

#### 字段配置项
| 配置项 | 说明 | 必填 |
|--------|------|------|
| key | 字段标识（英文，用于存储） | ✅ |
| label | 显示名称 | ✅ |
| type | 字段类型 | ✅ |
| required | 是否必填 | ✅ |
| placeholder | 占位提示文字 | ❌ |
| description | 字段说明/帮助文字 | ❌ |
| options | 选项列表（仅 select/radio/checkbox） | 条件必填 |

#### 支持的字段类型
| 类型 | 说明 | 渲染组件 |
|------|------|----------|
| text | 单行文本 | Input |
| textarea | 多行文本 | Textarea |
| url | 链接 | Input (带 URL 验证) |
| phone | 电话号码 | Input (带格式验证) |
| email | 邮箱 | Input (带邮箱验证) |
| image | 图片上传 | ImageUploader |
| file | 文件上传 | FileUploader |
| select | 下拉选择 | Select |
| radio | 单选 | RadioGroup |
| checkbox | 多选 | CheckboxGroup |

---

## 三、数据结构

### 3.1 数据库变更

#### Event 模型新增字段
```prisma
model Event {
  // ... 现有字段

  submissionFormConfig Json?  // 作品提交表单配置
}
```

#### submissionFormConfig JSON 结构
```typescript
interface SubmissionFormConfig {
  fields: SubmissionFormField[];
}

interface SubmissionFormField {
  key: string;           // 字段标识，如 "agentName"，需唯一
  label: string;         // 显示名称，如 "智能体名称"
  type: FieldType;       // 字段类型
  required: boolean;     // 是否必填
  placeholder?: string;  // 占位符
  description?: string;  // 字段说明
  options?: string[];    // select/radio/checkbox 的选项
  order: number;         // 排序序号
}

type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "phone"
  | "email"
  | "image"
  | "file"
  | "select"
  | "radio"
  | "checkbox";
```

#### 示例配置
```json
{
  "fields": [
    {
      "key": "realName",
      "label": "姓名",
      "type": "text",
      "required": true,
      "placeholder": "请输入真实姓名",
      "order": 0
    },
    {
      "key": "phone",
      "label": "电话",
      "type": "phone",
      "required": true,
      "placeholder": "请输入手机号码",
      "order": 1
    },
    {
      "key": "wechat",
      "label": "微信号",
      "type": "text",
      "required": true,
      "placeholder": "请输入微信号",
      "order": 2
    },
    {
      "key": "agentName",
      "label": "智能体名称",
      "type": "text",
      "required": true,
      "order": 3
    },
    {
      "key": "agentUrl",
      "label": "智能体发布后的链接",
      "type": "url",
      "required": true,
      "placeholder": "https://",
      "order": 4
    },
    {
      "key": "appStoreScreenshot",
      "label": "小米应用商店上架截图",
      "type": "image",
      "required": true,
      "description": "请上传应用商店截图",
      "order": 5
    },
    {
      "key": "shippingAddress",
      "label": "邮寄地址",
      "type": "textarea",
      "required": true,
      "placeholder": "请输入完整的邮寄地址（包含收件人、电话、地址）",
      "order": 6
    },
    {
      "key": "feedback",
      "label": "产品反馈",
      "type": "textarea",
      "required": false,
      "placeholder": "可选：分享你的使用体验和建议",
      "order": 7
    }
  ]
}
```

### 3.2 数据存储

自定义字段的答案存入 `Project.customFields`（已有字段）：

```json
{
  "realName": "张三",
  "phone": "13800138000",
  "wechat": "zhangsan",
  "agentName": "智能助手",
  "agentUrl": "https://example.com/agent",
  "appStoreScreenshot": "https://storage.example.com/screenshots/xxx.png",
  "shippingAddress": "北京市朝阳区xxx路xxx号",
  "feedback": "产品很好用，建议增加xxx功能"
}
```

---

## 四、API 变更

### 4.1 活动 API

#### 获取活动详情
`GET /api/events/:eventId`

响应新增字段：
```json
{
  "submissionFormConfig": {
    "fields": [...]
  }
}
```

#### 更新活动
`PATCH /api/events/:eventId`

请求体新增字段：
```json
{
  "submissionFormConfig": {
    "fields": [...]
  }
}
```

### 4.2 作品提交 API

无需修改，`customFields` 参数已支持。

---

## 五、前端文件变更

### 5.1 需要修改的文件

| 文件 | 变更内容 |
|------|----------|
| `src/modules/dashboard/events/components/submissions/EventSubmissionForm.tsx` | 重构为单页表单，支持动态渲染自定义字段 |
| `src/features/event-submissions/schema.ts` | 更新表单验证 schema |
| `src/app/(app)/app/(account)/events/[eventId]/submissions/new/page.tsx` | 传入活动配置 |

### 5.2 需要新增的文件

| 文件 | 说明 |
|------|------|
| `src/modules/dashboard/events/components/submissions/DynamicFormField.tsx` | 动态字段渲染组件 |
| `src/modules/dashboard/events/components/SubmissionFormConfigEditor.tsx` | 管理端：自定义问题配置编辑器 |
| `src/features/event-submissions/types.ts` | 新增类型定义（如已存在则更新） |

---

## 六、实现步骤

### Phase 1: 基础设施
1. 数据库：添加 `submissionFormConfig` 字段到 Event 模型
2. 后端：修改活动 API 支持新字段的读写

### Phase 2: 用户端表单重构
3. 前端：重构 `EventSubmissionForm` 为单页表单
4. 前端：实现 `DynamicFormField` 动态字段渲染组件
5. 前端：更新表单验证逻辑

### Phase 3: 管理端配置界面
6. 管理后台：实现 `SubmissionFormConfigEditor` 配置编辑器
7. 管理后台：集成到活动编辑页面

### Phase 4: 测试与优化
8. 测试各种字段类型的渲染和验证
9. 测试草稿保存和恢复
10. 测试编辑模式

---

## 七、兼容性考虑

### 数据兼容
- `submissionFormConfig` 为可选字段，默认为 null
- 当配置为空时，表单只显示基础字段（作品名称、介绍等）
- 现有作品数据不受影响

### 功能兼容
- 现有的作品提交流程保持可用
- 现有的作品广场、投票功能不受影响

---

## 八、后续扩展（暂不实现）

1. **字段模板**：预设常用字段组合，一键导入
2. **条件显示**：根据某个字段的值决定是否显示其他字段
3. **字段分组**：将字段分组显示，提升表单可读性
4. **导出数据**：管理员可导出所有提交的自定义字段数据
