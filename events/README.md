# Events - 活动运营工作台

这个文件夹用于管理社区活动的所有运营文件，包括海报、PPT、SOP、执行手册、报销表等。

## 📁 文件组织方式

按活动组织，每个活动一个文件夹：

```
events/
├── 2026-02-hackathon/          # 活动文件夹（格式：年月-活动类型）
│   ├── poster.pptx             # 活动海报
│   ├── sop.md                  # 活动标准操作流程
│   ├── handbook.md             # 执行手册
│   ├── expense-report.xlsx     # 报销表
│   └── assets/                 # 素材文件夹
│       ├── logo.png
│       └── photos/
├── templates/                  # 可复用模板
│   ├── poster-template.pptx
│   ├── sop-template.md
│   └── expense-template.xlsx
└── README.md
```

## 🚀 使用 AI Skill 快速生成文件

### 生成 PPT 海报

使用 `/pptx` skill 创建活动海报：

```bash
# 在 Claude Code 中使用
/pptx create poster for hackathon event
```

### 生成活动文档

直接让 Claude 帮你生成 SOP 或执行手册：

```
帮我生成一个黑客松活动的 SOP，包括活动前、中、后的流程
```

## 📝 文件命名规范

- **活动文件夹**：`YYYY-MM-活动类型` 例如：`2024-02-hackathon`
- **海报**：`poster.pptx` 或 `poster-v2.pptx`（多版本）
- **文档**：使用 Markdown 格式（`.md`），便于版本控制
- **表格**：`expense-report.xlsx`, `participant-list.xlsx`

## 🔒 版本控制说明

为了避免仓库过大，以下文件类型**不会**被提交到 Git：

- ✅ **会提交**：Markdown 文档（`.md`）、模板文件
- ❌ **不提交**：生成的 PPT（`.pptx`）、PDF（`.pdf`）、大图片、Excel 表格

需要时可以使用 AI skill 重新生成这些文件。

## 👥 团队协作

- 运营团队可以直接在 `/events/` 目录下工作
- PR 会自动分配给运营负责人审核（见 `.github/CODEOWNERS`）
- 如有问题，请联系运营负责人

## 📚 常用模板

在 `templates/` 文件夹中可以找到：
- 海报模板
- SOP 模板
- 报销表模板

复制模板到新活动文件夹即可开始使用。
