# HackathonWeekly Community

现代化的 Next.js 网站为 HackathonWeekly 社区打造。

## 🚀 功能特性

- **Next.js 15** 搭配 App Router 和 TypeScript
- **身份认证** 使用 Better Auth（社交登录、魔法链接等）
- **支付系统** 支持多个提供商（Stripe、WeChat Pay 等）
- **数据库** 使用 Prisma 和 PostgreSQL
- **国际化** 基于 next-intl
- **用户界面** 采用 Shadcn/ui、Radix UI 和 Tailwind CSS
- **内容管理** 使用 content-collections（MDX）
- **邮件服务** 支持多个提供商和 React Email
- **文件存储** 兼容 S3 的存储提供商
- **日志系统** 使用 Winston
- **数据分析** 支持多个分析平台（Umami、Google Analytics、百度统计）

## 📊 数据分析

我们使用 [Umami](https://umami.is/) 进行网站访问统计，数据公开透明。

**实时统计数据：** https://cloud.umami.is/share/dEpjaVKnRNqBAkH2/hackathonweekly.com

这个链接展示了网站的实时访问数据，包括：
- 页面访问量 (PV)
- 独立访客数 (UV)
- 访问来源
- 地理位置分布
- 设备和浏览器统计

## 📁 项目结构

本项目已从 monorepo 结构转换为传统 Next.js 格式，组织结构如下：

```
src/
├── app/                    # Next.js App Router 页面和布局
│   ├── (public)/           # 公共页面（首页、博客、文档）
│   ├── (app)/              # 应用页面
│   ├── api/                # API 路由
│   └── globals.css         # 全局样式
├── components/             # 按功能组织的 React 组件
│   ├── marketing/          # 营销页面专用组件
│   ├── dashboard/          # 仪表板应用组件
│   ├── shared/            # 共享组件
│   ├── ui/                # UI 组件（Shadcn/ui）
│   └── i18n/              # 国际化组件
├── lib/                   # 核心库和工具
│   ├── ai/                # AI/LLM 集成
│   ├── api/               # API 工具和中间件
│   ├── auth/              # 身份认证配置
│   ├── database/          # 数据库（Prisma）工具
│   ├── i18n/              # 国际化工具
│   ├── logs/              # 日志配置
│   ├── mail/              # 邮件工具和模板
│   ├── payments/          # 支付提供商集成
│   ├── storage/           # 文件存储工具
│   └── utils/             # 通用工具
├── config/                # 应用配置
├── styles/                # 额外的 CSS 文件
├── types/                 # TypeScript 类型定义
└── hooks/                 # 自定义 React hooks
```

## 🛠️ 快速开始

1. **克隆仓库**
   ```bash
   git clone https://github.com/hackathonweekly.git
   cd community
   ```

2. **安装依赖**
   ```bash
   bun install
   ```

3. **设置环境变量**
   （推荐使用 Neon DB）
   ```bash
   cp .env.local.example .env.local
   # 编辑 .env.local 文件，填入你的配置
   ```

4. **设置数据库**
   ```bash
   bun db:generate
   bun db:push
   ```

5. **启动开发服务器**
   ```bash
   bun dev
   ```

## 📚 文档

项目包含全面的文档，位于 `/docs` 目录，涵盖以下内容：

- 入门指南
- 配置选项
- 支付提供商设置
- 身份认证设置
- 部署说明

## 🔧 脚本命令

- `bun dev` - 启动开发服务器
- `bun run build` - 构建生产版本
- `bun start` - 启动生产服务器
- `bun lint` - 运行 Biome 代码检查
- `bun format` - 使用 Biome 格式化代码
- `bun type-check` - TypeScript 类型检查
- `bun db:generate` - 生成 Prisma 客户端
- `bun db:push` - 推送数据库结构
- `bun db:studio` - 打开 Prisma Studio

## 🪝 Git Hooks

本项目使用 [Husky](https://typicode.github.io/husky/) 管理 Git 钩子以维护代码质量：

- **pre-commit**: 提交前自动使用 Biome 格式化暂存文件
- 运行 `bun install` 时会自动安装钩子
- 所有团队成员都将配置相同的钩子

### 新团队成员注意

克隆仓库并运行 `bun install` 后，Git 钩子将自动配置。这确保了团队间一致的代码格式化。

## 🌐 国际化 (i18n)

本项目使用 next-intl 支持多种语言。翻译文件位于 `src/lib/i18n/translations/`。

### 翻译管理

要验证和检查缺失的翻译，使用 `i18n-check` 命令行工具：

1. **安装 i18n-check**
   ```bash
   bun add -D @lingual/i18n-check
   ```

2. **检查缺失的翻译**
   ```bash
   bun exec i18n-check --locales src/lib/i18n/translations --source en --format i18next
   ```

3. **添加到 package.json 脚本**（可选）
   ```json
   {
     "scripts": {
       "i18n:check": "i18n-check --locales src/lib/i18n/translations --source en --format i18next"
     }
   }
   ```

该工具将识别：
- 目标语言中缺失的翻译
- 未使用的翻译键
- 翻译间 ICU 参数使用不一致的问题

## 🚀 部署指南

本项目支持多种部署方式，推荐使用 Docker 进行部署。

### Docker 部署（推荐）

**完整的 Docker 部署文档请查看：[DOCKER.md](DOCKER.md)**

#### 🚀 快速部署（3分钟）

1. **本地测试**
   ```bash
   # 复制环境变量模板
   cp .env.local.example .env.local

   # 启动容器（会自动构建镜像）
   make up

   # 查看日志确认启动成功
   make logs
   ```

2. **生产部署**
   ```bash
   # 一键发布镜像到仓库
   make release TAG=v1.2.0

   # 一键部署到生产环境
   make deploy TAG=v1.2.0
   ```

3. **紧急回滚**
   ```bash
   make rollback TAG=v1.1.9
   ```

#### 📝 环境变量配置

| 文件 | 用途 | 位置 |
|------|------|------|
| `.env.local` | 本地开发和测试 | 本地机器，不提交到 Git |
| `.env.production` | 生产环境 | 生产服务器，包含敏感信息 |

#### 🐳 Docker 命令速查

| 命令 | 用途 |
|------|------|
| `make up` | 启动本地容器 |
| `make down` | 停止容器 |
| `make logs` | 查看日志 |
| `make release TAG=vX.X.X` | 构建并发布镜像 |
| `make deploy TAG=vX.X.X` | 部署到生产环境 |
| `make rollback TAG=vX.X.X` | 回滚版本 |
| `make help` | 查看所有命令 |

### Vercel 部署（推荐新手）

Vercel 是最简单的 Next.js 部署方式：

1. **GitHub 集成**
   - 将代码推送到 GitHub
   - 在 [Vercel](https://vercel.com) 导入项目
   - 配置环境变量
   - 自动部署

2. **环境变量配置**
   在 Vercel Dashboard 配置：
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - 其他必需的环境变量

### 传统服务器部署

如果你需要部署到传统服务器（非 Docker），请参考：

#### 环境要求
- Node.js >= 20
- PostgreSQL 数据库（推荐使用 [Neon DB](https://neon.tech/)）
- Linux 服务器

#### 部署步骤
```bash
# 1. 构建应用
bun run build

# 2. 复制必要文件到服务器
# - .next/standalone/（主程序）
# - .next/static/（静态文件）
# - public/（公共文件）
# - .env.production（环境变量）

# 3. 在服务器启动
cd your-deploy-path
node server.js
```

#### PM2 进程管理
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name community

# 常用命令
pm2 list                    # 查看所有进程
pm2 logs community         # 查看应用日志
pm2 restart community      # 重启应用
pm2 stop community         # 停止应用
pm2 monit                   # 监控面板
```

## 🔧 Git Remote 配置

本项目同时在 GitHub 和 CNB 平台维护仓库，为了方便协作，建议配置双推送功能：

### 克隆仓库

**从 GitHub 克隆（推荐）：**
```bash
git clone git@github.com:hackathonweekly/community.git
cd community
```

**从 CNB 克隆：**
```bash
git clone https://cnb.cool/hackathonweekly/community.git
cd community
```

### 配置双推送（推荐）

克隆后，添加额外的推送 URL，这样一条命令就能同时推送到两个仓库：

```bash
# 如果从 GitHub 克隆，添加 CNB 作为额外推送地址
git remote set-url --add --push origin https://cnb.cool/hackathonweekly/community

# 如果从 CNB 克隆，添加 GitHub 作为额外推送地址
git remote set-url --add --push origin git@github.com:hackathonweekly/community.git
```

配置完成后，使用 `git push origin main` 即可同时推送到两个仓库。

### 验证配置

```bash
git remote -v
```

你应该看到类似这样的输出（origin 有多个 push URL）：
```
origin  git@github.com:hackathonweekly/community.git (fetch)
origin  git@github.com:hackathonweekly/community.git (push)
origin  https://cnb.cool/hackathonweekly/community (push)
```

### 使用方式

配置完成后，正常使用 Git 即可：
```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main  # 这会同时推送到 GitHub 和 CNB
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 [Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)](LICENSE)。

### 🎯 许可证要点

- ✅ **允许使用**：个人学习、研究、教育、开源协作
- ✅ **允许修改**：可以修改和改编代码
- ✅ **允许分享**：可以分享原版和修改版本
- ❌ **禁止商业使用**：未经授权不得用于商业目的
- 🏷️ **需要署名**：使用时必须保留版权声明

### 💼 商业使用

如需商业使用本项目，请联系：
- **邮箱**：contact@hackathonweekly.com
- **标题**：[商业使用许可申请] HackathonWeekly Community

### 📚 相关文档

- [贡献指南](CONTRIBUTING.md) - 如何参与项目贡献
- [开发规范](DEVELOPMENT.md) - 详细的开发规范和最佳实践
- [行为准则](CODE_OF_CONDUCT.md) - 社区行为准则
- [贡献者协议](DCLA.md) - 开发者授权协议