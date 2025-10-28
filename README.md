# HackathonWeekly Community

A modern Next.js Website for HackathonWeekly Community.

## 🚀 Features

- **Next.js 15** with App Router and TypeScript
- **Authentication** with Better Auth (social login, magic links, etc.)
- **Payments** with multiple providers (Stripe, LemonSqueezy, Polar, etc.)
- **Database** with Prisma and PostgreSQL
- **Internationalization** with next-intl
- **UI** with Shadcn/ui, Radix UI, and Tailwind CSS
- **Content Management** with content-collections (MDX)
- **Email** with multiple providers and React Email
- **Storage** with S3-compatible providers
- **Logging** with Winston
- **Analytics** with multiple providers (Umami, Google Analytics, Baidu Analytics)

## 📊 Analytics

我们使用 [Umami](https://umami.is/) 进行网站访问统计，数据公开透明。

**实时统计数据：** https://cloud.umami.is/share/dEpjaVKnRNqBAkH2/hackathonweekly.com

这个链接展示了网站的实时访问数据，包括：
- 页面访问量 (PV)
- 独立访客数 (UV)
- 访问来源
- 地理位置分布
- 设备和浏览器统计

## 📁 Project Structure

This project has been transformed from a monorepo structure to a traditional Next.js format with the following organization:

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (public)/           # Public pages (home, blog, docs)
│   ├── (app)/              # Application pages
│   ├── api/                # API routes
│   └── globals.css         # Global styles
├── components/             # React components organized by feature
│   ├── marketing/          # Marketing-specific components
│   ├── dashboard/          # Dashboard application components
│   ├── shared/            # Shared components
│   ├── ui/                # UI components (Shadcn/ui)
│   └── i18n/              # Internationalization components
├── lib/                   # Core libraries and utilities
│   ├── ai/                # AI/LLM integrations
│   ├── api/               # API utilities and middleware
│   ├── auth/              # Authentication configuration
│   ├── database/          # Database (Prisma) utilities
│   ├── i18n/              # Internationalization utilities
│   ├── logs/              # Logging configuration
│   ├── mail/              # Email utilities and templates
│   ├── payments/          # Payment provider integrations
│   ├── storage/           # File storage utilities
│   └── utils/             # General utilities
├── config/                # Application configuration
├── styles/                # Additional CSS files
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## 🛠️ Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/hackathonweekly.git
   cd community
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
- recommand neon db
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   bun db:generate
   bun db:push
   ```

5. **Start the development server**
   ```bash
   bun dev
   ```

## 📚 Documentation

The project includes comprehensive documentation in the `/docs` section covering:

- Getting started guide
- Configuration options
- Payment provider setup
- Authentication setup
- Deployment instructions

## 🔧 Scripts

- `bun dev` - Start development server
- `bun run build` - Build for production
- `bun start` - Start production server
- `bun lint` - Run Biome linter
- `bun format` - Format code with Biome
- `bun type-check` - TypeScript type checking
- `bun db:generate` - Generate Prisma client
- `bun db:push` - Push database schema
- `bun db:studio` - Open Prisma Studio

## 🪝 Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) to manage Git hooks for maintaining code quality:

- **pre-commit**: Automatically formats staged files using Biome before commit
- The hooks are automatically installed when you run `bun install`
- All team members will have the same hooks configured

### For New Team Members

After cloning the repository and running `bun install`, the Git hooks will be automatically configured. This ensures consistent code formatting across the team.

## 🌐 Internationalization (i18n)

This project supports multiple languages using next-intl. Translation files are located in `src/lib/i18n/translations/`.

### Managing Translations

To validate and check for missing translations, use the `i18n-check` CLI tool:

1. **Install i18n-check**
   ```bash
   bun add -D @lingual/i18n-check
   ```

2. **Check for missing translations**
   ```bash
   bun exec i18n-check --locales src/lib/i18n/translations --source en --format i18next
   ```

3. **Add to package.json scripts** (optional)
   ```json
   {
     "scripts": {
       "i18n:check": "i18n-check --locales src/lib/i18n/translations --source en --format i18next"
     }
   }
   ```

The tool will identify:
- Missing translations in target locales
- Unused translation keys
- Inconsistent ICU argument usage across translations

## 🚀 部署指南

### 云服务器部署（自己的服务器）

项目提供了全自动化部署脚本，支持一键部署到你的云服务器。

#### 准备工作

1. **环境要求**
   - Node.js >= 20
   - PostgreSQL 数据库（推荐使用 [Neon DB](https://neon.tech/)）
   - SSH 访问权限的 Linux 服务器

2. **配置 SSH 密钥认证（免密登录）**
   ```bash
   # 生成 SSH 密钥（如果没有）
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   
   # 将公钥复制到服务器
   ssh-copy-id -p 22 username@server-ip
   
   # 测试连接
   ssh username@server-ip "echo 'SSH 连接成功'"
   ```

3. **创建部署配置**
   ```bash
   cp .env.deploy.example .env.deploy # 然后修改配置
   ```

#### 首次部署

```bash
# 运行自动部署
bash deploy.sh
```

部署脚本会自动完成：
- ✅ 构建项目
- ✅ 打包必要文件
- ✅ 上传到服务器
- ✅ 安装依赖
- ✅ 配置 PM2 进程管理
- ✅ 启动应用

#### 服务器环境变量配置

首次部署后，需要在服务器创建 `.env.local` 文件：

```bash
ssh username@server-ip
cd your-server-deploy-path

# 创建环境变量文件 .env.local （参考 .env.local.example）

# 重启应用
pm2 restart community
```

#### PM2 进程管理

常用命令：
```bash
pm2 list                           # 查看所有进程
pm2 logs community # 查看应用日志
pm2 restart community # 重启应用
pm2 stop community    # 停止应用
pm2 monit                             # 监控面板
```

### Vercel 部署（推荐新手）

Vercel 是最简单的 Next.js 部署方式：

1. **使用 Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   # 跟随提示完成部署
   ```

2. **GitHub 集成**
   - 将代码推送到 GitHub
   - 在 [Vercel](https://vercel.com) 导入项目
   - 配置环境变量
   - 自动部署

3. **环境变量配置**
   在 Vercel Dashboard 配置：
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - 其他必需的环境变量

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [Todo] License.


## Why use standalone?

### benefit of standalone

传统方式：
- 需要复制 .next/、package.json、安装 node_modules
- 体积大，依赖复杂

Standalone 方式：
- 只需复制 .next/standalone/ 和静态文件
- 体积小，自包含，无需安装依赖
- 启动：node server.js（而不是 npm start）

部署包对比

# 传统方式：~2GB (包含 cache 和 node_modules)
.next/ + node_modules/ + package.json

# Standalone 方式：~100MB
.next/standalone/ + public/ + .next/static/

- standalone 可以正确处理 honojs api
- 使用 standalone 时，npm build 之后运行 next start 时，实际上使用的是 `node .next/standalone/server.js` 而不是 `npm start`


### 使用 standalone + bun 的问题
https://github.com/vercel/next.js/issues/56900

会出现： Error: Cannot find module 'styled-jsx/style' 这个错误

我的解决方案就是本地用 bun 来开发，然后用 npm 来部署项目，不使用 bun


### 需要复制的其他文件
⏺ 对于 Next.js standalone 模式，你确实需要复制一些额
  外的文件，但不是所有内容：

  必须复制的文件：

  1. public/ 文件夹 - 静态资源（图片、图标等）
  2. .next/static/ 文件夹 -
  构建生成的静态文件（JS、CSS chunks等）

  标准的 standalone 部署结构：

  deployment/
  ├── .next/standalone/          # 主程序文件
  ├── .next/static/             # 静态资源 (必须)
  ├── public/                   # 公共文件 (必须)
  └── server.js                # 入口文件

  典型的复制命令：

  # 复制 standalone 文件
  cp -r .next/standalone/* ./deployment/

  # 复制静态文件
  cp -r .next/static ./deployment/.next/

  # 复制 public 文件
  cp -r public ./deployment/

  不需要复制的文件：

  - node_modules/ (standalone 已包含必要依赖)
  - src/ (源码不需要)
  - .next/cache/ (缓存文件)
  - 开发相关配置文件

  最佳实践 - Docker 示例：

  # 构建阶段
  FROM node:18 AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  # 运行阶段
  FROM node:18-alpine AS runner
  WORKDIR /app
  # 复制 standalone 文件
  COPY --from=builder /app/.next/standalone ./
  # 复制静态文件
  COPY --from=builder /app/.next/static
  ./.next/static
  # 复制 public 文件
  COPY --from=builder /app/public ./public
  EXPOSE 3000
  CMD ["node", "server.js"]

  所以答案是：是的，你需要复制 public/ 和
  .next/static/，但不需要复制源码和 node_modules。
  

⏺ .next/static/ 里面是什么？

  .next/static/ 包含：
  - JavaScript chunks - 代码分割后的 JS 文件
  - CSS 文件 - 样式表
  - 客户端资源 - React hydration 需要的文件
  - 媒体文件 - 优化后的图片、字体等
  - Webpack 生成的资源 - 带有 hash 的静态文件

  为什么不在 standalone 里？

  Next.js 设计上将静态资源和服务器代码分离：

  1. 性能考虑 - 静态文件通常由 CDN/Nginx
  提供，不需要 Node.js 处理
  2. 缓存策略 - 静态文件有 hash，可以长期缓存
  3. 部署灵活性 - 可以将静态文件部署到不同位置

  典型的生产部署架构：
  CDN/Nginx → 静态文件 (.next/static/, public/)
      ↓
  Load Balancer → Node.js 服务器 (standalone)