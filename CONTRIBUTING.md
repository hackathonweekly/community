# 贡献指南 (Contributing Guide)

感谢您对 HackathonWeekly 社区平台的关注！我们欢迎所有形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [贡献者协议](#贡献者协议)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [提交流程](#提交流程)
- [报告问题](#报告问题)
- [功能请求](#功能请求)
- [社区准则](#社区准则)

---

## 🤝 行为准则

参与本项目即表示您同意遵守我们的[行为准则](CODE_OF_CONDUCT.md)。

## 📜 贡献者协议

**重要：提交代码前请阅读**

本项目采用双授权模式：
- **AGPL-3.0** 用于非商用和开源使用
- **商业授权** 用于商业使用

通过提交 Pull Request，您同意：
1. 您的贡献将在 AGPL-3.0 下发布
2. 您授权项目维护者将您的贡献用于商业授权
3. 您保证您的贡献是原创作品或您有权提交

详细信息请阅读 [CLA.md](CLA.md)。

## 🚀 如何贡献

### 贡献类型

我们欢迎以下类型的贡献：

- 🐛 **Bug 修复**
- ✨ **新功能开发**
- 📝 **文档改进**
- 🎨 **UI/UX 改进**
- ⚡ **性能优化**
- 🧪 **测试覆盖**
- 🌍 **国际化**

### 贡献流程概览

1. **Fork** 项目到您的 GitHub 账户
2. **Clone** 您的 fork 到本地
3. **创建分支** 进行开发
4. **提交代码** 遵循提交规范
5. **创建 Pull Request** 并确认同意 CLA
6. **代码审查** 和讨论
7. **合并** 到主分支

## 🛠️ 开发环境设置

### 前置要求

- **Node.js >= 20**
- **pnpm** (包管理器)
- **Git**
- **PostgreSQL** (开发数据库)

### 快速开始

```bash
# 1. Fork 并克隆项目
git clone https://github.com/YOUR_USERNAME/hackathon-weekly-community.git
cd hackathon-weekly-community

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp apps/web/.env.example apps/web/.env.local
# 编辑 apps/web/.env.local 文件

# 4. 初始化数据库
pnpm db:generate
pnpm db:push

# 5. 启动开发服务器
pnpm dev
```

### 开发工具

```bash
# 代码质量检查
pnpm lint          # 运行 Biome linter
pnpm lint:fix      # 自动修复问题
pnpm format        # 格式化代码
pnpm type-check    # TypeScript 类型检查

# 数据库操作
pnpm db:studio     # 打开 Prisma Studio
pnpm db:seed       # 填充测试数据

# 测试
pnpm e2e           # E2E 测试
```

## 📝 提交流程

### 1. 创建分支

```bash
# 确保是最新的 develop 分支
git checkout develop
git pull origin develop

# 创建功能分支
git checkout -b feature/your-feature-name
# 或修复分支
git checkout -b fix/issue-description
```

### 2. 开发和提交

遵循我们的 [Git 提交规范](DEVELOPMENT.md#git-commit-提交规范)：

```bash
# 添加文件
git add .

# 提交
git commit -m "feat(auth): add WeChat login"

# 推送到您的 fork
git push origin feature/your-feature-name
```

### 3. 创建 Pull Request

1. 访问 GitHub 上的您的 fork
2. 点击 "New Pull Request"
3. 选择正确的分支：
   - **base**: `develop` (日常开发) 或 `main` (紧急修复)
   - **compare**: 您的功能分支
4. 填写 PR 模板
5. **确认勾选 CLA 同意项**
6. 等待代码审查

### PR 模板

```markdown
## 变更描述
简要描述本次变更的内容和目的

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 其他

## 测试清单
- [ ] 代码已通过本地测试
- [ ] 已添加或更新相关测试
- [ ] 已通过自动化测试 (CI/CD)
- [ ] 已进行手动测试

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 已更新相关文档
- [ ] 无 TypeScript 类型错误
- [ ] 通过所有 lint 检查
- [ ] 分支已同步最新 develop
- [ ] **我已阅读并同意 [CLA](CLA.md)**

## 相关 Issue
Closes #issue_number
```

## 🐛 报告问题

### Bug 报告

在提交 bug 报告前，请：

1. **检查现有 Issue** - 避免重复报告
2. **确认最新版本** - 确保问题未在最新版本中修复
3. **提供最小复现** - 帮助我们快速定位问题

### Bug 报告模板

```markdown
**Bug 描述**
清晰简洁地描述问题

**复现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
描述您期望发生的情况

**实际行为**
描述实际发生的情况

**截图**
如果适用，添加截图来帮助解释问题

**环境信息**
- 操作系统: [例如 iOS]
- 浏览器: [例如 chrome, safari]
- 版本: [例如 22]

**额外信息**
添加任何其他相关信息
```

## ✨ 功能请求

### 请求新功能

1. **检查现有 Issue** - 避免重复请求
2. **详细描述需求** - 说明使用场景和价值
3. **考虑实现方案** - 如果有想法可以分享

## 👥 社区准则

### 沟通方式

- **GitHub Issues**: 用于 bug 报告和功能讨论
- **GitHub Discussions**: 用于一般讨论和问答
- **Pull Request**: 用于代码审查和技术讨论

### 贡献者权利与义务

- 提交 PR 时请确认同意 [CLA](CLA.md)
- 您仍然是您贡献部分的版权所有者
- 您的贡献将被记录在贡献者列表中
- 您授权项目维护者将您的贡献用于商业授权

### 维护者责任

- 及时回应和审查贡献
- 提供清晰和建设性的反馈
- 维护项目的健康和可持续发展

## 📚 学习资源

### 项目相关

- [项目架构文档](docs/ARCHITECTURE.md)
- [API 文档](http://localhost:3000/api/docs)
- [开发规范](DEVELOPMENT.md)

### 技术栈学习

- [Next.js 文档](https://nextjs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 🏆 贡献者认可

我们感谢所有贡献者的努力！贡献将被记录在：

- 项目 README 的贡献者列表
- Release notes 中
- 年度贡献者报告

## 📞 联系方式

如有疑问或需要帮助，请通过以下方式联系：

- **GitHub Issues**: 技术问题和 bug 报告
- **GitHub Discussions**: 一般讨论和问答
- **Email**: [contact@hackathonweekly.com](mailto:contact@hackathonweekly.com)

---

## 📄 许可证

本项目采用双授权模式：
- 代码：[AGPL-3.0](LICENSE) 用于非商用，商业使用需要[商业授权](LICENSE.COMMERCIAL)
- 文档：[CC BY-NC-SA 4.0](LICENSE-DOCS) 禁止商用

详细说明请参阅 [CLA.md](CLA.md)

---

通过参与这个项目，您正在帮助构建更好的 HackathonWeekly 社区平台。
