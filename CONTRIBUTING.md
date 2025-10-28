# 贡献指南 (Contributing Guide)

感谢您对 HackathonWeekly 社区平台的关注！我们欢迎所有形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [提交流程](#提交流程)
- [报告问题](#报告问题)
- [功能请求](#功能请求)
- [社区准则](#社区准则)

---

## 🤝 行为准则

参与本项目即表示您同意遵守我们的[行为准则](CODE_OF_CONDUCT.md)。

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
5. **创建 Pull Request**
6. **代码审查** 和讨论
7. **合并** 到主分支

## 🛠️ 开发环境设置

### 前置要求

- **Node.js >= 20**
- **Bun** (推荐包管理器)
- **Git**
- **PostgreSQL** (开发数据库)

### 快速开始

```bash
# 1. Fork 并克隆项目
git clone https://github.com/YOUR_USERNAME/hackathon-weekly-community.git
cd hackathon-weekly-community

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 文件

# 4. 初始化数据库
bun db:generate
bun db:push

# 5. 启动开发服务器
bun dev
```

### 开发工具

```bash
# 代码质量检查
bun lint          # 运行 Biome linter
bun lint:fix      # 自动修复问题
bun format        # 格式化代码
bun type-check    # TypeScript 类型检查

# 数据库操作
bun db:studio     # 打开 Prisma Studio
bun db:seed       # 填充测试数据

# 测试
bun e2e           # E2E 测试
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

# 提交（推荐使用 commitizen）
bun run cz  # 交互式提交工具
# 或手动提交
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
5. 等待代码审查

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

### 功能请求模板

```markdown
**功能描述**
清晰简洁地描述您想要的功能

**问题背景**
描述这个功能要解决的问题

**解决方案**
描述您希望如何实现这个功能

**替代方案**
描述您考虑过的其他解决方案

**额外信息**
添加任何其他相关信息或截图
```

## 👥 社区准则

### 沟通方式

- **GitHub Issues**: 用于 bug 报告和功能讨论
- **GitHub Discussions**: 用于一般讨论和问答
- **Pull Request**: 用于代码审查和技术讨论

### 贡献者权利

- 您的贡献将被记录在贡献者列表中
- 您的代码将保留您的版权信息
- 您可以随时撤回未合并的贡献

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

再次感谢您的贡献！🎉

## 📄 许可证

本项目采用 [Creative Commons Attribution-NonCommercial 4.0 International License](LICENSE)。

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

---

通过参与这个项目，您正在帮助构建更好的 HackathonWeekly 社区平台。