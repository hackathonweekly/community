# 开发规范文档 (Development Standards)

本文档定义了 HackathonWeekly 社区平台的开发规范，确保代码质量、协作效率和项目可维护性。

## 目录

- [Git Commit 提交规范](#git-commit-提交规范)
- [代码风格规范](#代码风格规范)
- [分支管理规范](#分支管理规范)
- [代码审查规范](#代码审查规范)
- [测试规范](#测试规范)
- [文档规范](#文档规范)

---

## Git Commit 提交规范

### 基本格式

我们采用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type 类型说明

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD 相关
- `build`: 构建系统或依赖变更

### Scope 范围说明

Scope 用于说明 commit 影响的范围，常见的有：

- `auth`: 认证相关
- `db`: 数据库相关
- `ui`: UI 组件
- `api`: API 接口
- `i18n`: 国际化
- `payment`: 支付功能
- `config`: 配置文件

### Description 描述规范

- 使用动词开头，如：添加、修复、更新、删除
- 使用第一人称现在时
- 首字母小写
- 结尾不加句号
- 简洁明了，不超过 50 个字符

### Body 正文规范（可选）

- 详细描述本次变更的内容
- 说明变更的原因和动机
- 可以包含多个段落
- 每行不超过 72 个字符

### Footer 脚注规范（可选）

#### Breaking Changes

```
feat(api): remove deprecated user endpoint

BREAKING CHANGE: The `GET /api/users/legacy` endpoint has been removed.
Use `GET /api/users` instead.
```

#### 关联 Issue

```
fix(auth): resolve login validation error

Closes #123
Fixes #456
```

### 示例

#### ✅ 好的示例

```bash
feat(auth): add WeChat OAuth integration

Implement WeChat OAuth login flow with account linking functionality.
Users can now authenticate using WeChat and link it to existing accounts.

Closes #78
```

```bash
fix(db): resolve connection pool timeout

Increase connection pool timeout from 30s to 60s to handle
high-load scenarios during peak hours.

Fixes #124
```

```bash
docs(i18n): update translation guidelines

Add instructions for adding new translation keys
and update contribution guidelines for translators.
```

#### ❌ 错误示例

```bash
# 缺少类型和范围
fixed the login bug

# 描述过长且不清晰
feat: I added a new feature that allows users to login with WeChat and also link their existing accounts to the WeChat account so they can have a better user experience

# 使用过去时
fixed: resolve login issue

# 描述结尾有句号
feat(auth): Add WeChat login.
```

### Commitizen 工具推荐

为了确保提交信息规范，推荐使用以下工具：

```bash
# 安装 commitizen
bun add -D commitizen cz-conventional-changelog

# 初始化配置
echo '{ "path": "./node_modules/cz-conventional-changelog" }' > .czrc

# 使用 cz 代替 git commit
bun run cz
```

---

## 代码风格规范

### TypeScript/JavaScript 规范

1. **使用 TypeScript 严格模式**
   - 启用所有严格检查选项
   - 优先使用 `interface` 而不是 `type`
   - 避免使用 `enum`，使用常量对象或 map 代替

2. **命名规范**
   ```typescript
   // 变量和函数：camelCase
   const userName = 'john';
   const getUserInfo = () => {};

   // 类和接口：PascalCase
   class UserService {}
   interface UserProfile {}

   // 常量：UPPER_SNAKE_CASE
   const API_BASE_URL = 'https://api.example.com';

   // 文件名：kebab-case
   // user-service.ts
   // user-profile.component.tsx
   ```

3. **函数组件规范**
   ```typescript
   // 导出的组件放在最前面
   export default function UserProfile() {
     return <div>...</div>;
   }

   // 子组件使用辅助函数
   function UserAvatar() {
     return <div>...</div>;
   }

   // 工具函数
   function formatUserName(name: string) {
     return name.trim();
   }

   // 类型定义
   type UserProps = {
     name: string;
     email: string;
   };
   ```

### CSS/Tailwind 规范

1. **使用 Tailwind CSS 类名**
   - 优先使用 utility classes
   - 复杂组件使用 `@apply` 指令
   - 响应式设计：mobile-first

2. **类名组织顺序**
   ```tsx
   <div className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md">
     {/* Layout -> Spacing -> Colors -> Borders -> Effects */}
   </div>
   ```

### 文件组织规范

1. **导入顺序**
   ```typescript
   // 1. React 相关
   import { useState, useEffect } from 'react';
   import Link from 'next/link';

   // 2. 第三方库
   import { zodResolver } from '@hookform/resolvers/zod';

   // 3. 内部模块（使用路径别名）
   import { Button } from '@/components/ui/button';
   import { authConfig } from '@/lib/auth';

   // 4. 相对路径导入
   import { UserAvatar } from './user-avatar';
   ```

2. **组件文件结构**
   ```typescript
   // 1. 类型定义
   type ComponentProps = {};

   // 2. 主组件
   export default function Component() {}

   // 3. 子组件
   function SubComponent() {}

   // 4. 工具函数
   function helper() {}
   ```

---

## 分支管理规范

### 分支策略

我们采用 **Git Flow** 的简化版本：

```
main (生产分支)
├── develop (开发分支)
├── feature/xxx (功能分支)
├── hotfix/xxx (热修复分支)
└── release/xxx (发布分支)
```

### 分支命名规范

- `main`: 生产环境分支
- `develop`: 开发环境分支
- `feature/功能描述`: 新功能开发
- `hotfix/问题描述`: 紧急修复
- `release/版本号`: 发布准备
- `docs/文档更新`: 文档更新

### 分支操作规范

1. **创建功能分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/user-authentication
   ```

2. **提交代码**
   ```bash
   git add .
   git commit -m "feat(auth): implement user login"
   git push origin feature/user-authentication
   ```

3. **合并到 develop**
   ```bash
   # 通过 Pull Request 合并
   # 确保通过所有检查和代码审查
   ```

4. **发布到 main**
   ```bash
   git checkout main
   git merge develop --no-ff
   git tag v1.0.0
   git push origin main --tags
   ```

### 工作流程

1. **新功能开发**
   ```
   develop → feature/* → PR → develop → release/* → main
   ```

2. **紧急修复**
   ```
   main → hotfix/* → PR → main + develop
   ```

3. **日常开发**
   - 所有新功能从 `develop` 分支创建
   - 完成后通过 PR 合并回 `develop`
   - 定期将 `develop` 合并到 `main` 发布

---

## 代码审查规范

### Pull Request 规范

1. **PR 标题格式**
   ```
   <type>: <description>

   例如：
   feat: add user authentication
   fix: resolve login validation error
   ```

2. **PR 描述模板**
   ```markdown
   ## 变更描述
   简要描述本次变更的内容

   ## 变更类型
   - [ ] 新功能
   - [ ] Bug 修复
   - [ ] 文档更新
   - [ ] 代码重构
   - [ ] 性能优化
   - [ ] 其他

   ## 测试
   - [ ] 已添加单元测试
   - [ ] 已通过手动测试
   - [ ] 已通过自动化测试

   ## 检查清单
   - [ ] 代码符合项目规范
   - [ ] 已添加必要的注释
   - [ ] 已更新相关文档
   - [ ] 无类型错误
   - [ ] 通过所有 lint 检查

   ## 相关 Issue
   Closes #issue_number
   ```

### 审查要点

1. **功能正确性**
   - 代码是否实现了预期功能
   - 是否有潜在 bug
   - 边界条件处理是否完善

2. **代码质量**
   - 代码结构是否清晰
   - 是否遵循项目规范
   - 变量和函数命名是否合理
   - 是否有重复代码

3. **性能考虑**
   - 是否有性能问题
   - 数据库查询是否优化
   - 是否有不必要的重新渲染

4. **安全性**
   - 是否有安全漏洞
   - 输入验证是否完善
   - 敏感信息是否泄露

### 审查流程

1. **自动检查**
   - CI/CD 流水线自动运行
   - 代码格式检查
   - 类型检查
   - 单元测试

2. **人工审查**
   - 至少需要一个审查者批准
   - 关注业务逻辑和代码质量
   - 提供建设性反馈

3. **合并要求**
   - 所有自动检查通过
   - 至少一个审查者批准
   - 解决所有审查意见
   - 没有 merge conflicts

---

## 测试规范

### 测试策略

1. **单元测试**
   - 覆盖核心业务逻辑
   - 测试覆盖率目标：80%+
   - 使用 Jest + Testing Library

2. **集成测试**
   - API 接口测试
   - 数据库操作测试
   - 第三方服务集成测试

3. **E2E 测试**
   - 关键用户流程
   - 跨浏览器兼容性
   - 使用 Playwright

### 测试文件规范

```typescript
// user.service.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
      };

      await expect(userService.createUser(userData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

---

## 文档规范

### 代码注释

1. **JSDoc 规范**
   ```typescript
   /**
    * 计算用户的年龄
    * @param birthDate - 出生日期
    * @returns 用户年龄（岁）
    * @throws {Error} 当出生日期无效时抛出错误
    *
    * @example
    * ```typescript
    * const age = calculateUserAge(new Date('1990-01-01'));
    * console.log(age); // 33
    * ```
    */
   function calculateUserAge(birthDate: Date): number {
     // 实现代码
   }
   ```

2. **复杂逻辑注释**
   ```typescript
   // 检查用户是否有权限访问资源
   // 1. 验证用户是否已登录
   // 2. 检查用户角色权限
   // 3. 验证资源访问规则
   if (!user || !hasPermission(user, resource)) {
     throw new UnauthorizedError();
   }
   ```

### README 文档

项目 README 应包含：

1. **项目简介**
2. **技术栈**
3. **快速开始**
4. **开发指南**
5. **部署说明**
6. **贡献指南**

### API 文档

- 使用 OpenAPI 规范
- 自动生成文档：`/api/docs`
- 包含请求/响应示例
- 错误码说明

---

## 工具配置

### 推荐工具

1. **代码格式化**：Biome
2. **类型检查**：TypeScript
3. **代码审查**：GitHub PR
4. **测试**：Jest + Playwright
5. **提交规范**：Commitizen
6. **文档**：自动生成的 OpenAPI 文档

### VS Code 扩展推荐

- Biome
- TypeScript Importer
- Prettier
- ES7+ React/Redux/React-Native snippets
- GitLens

---

## 总结

遵循这些开发规范将帮助我们：

- 🎯 **提高代码质量**：统一的风格和规范
- 🚀 **提升开发效率**：清晰的工作流程
- 👥 **改善团队协作**：标准化的沟通方式
- 🛡️ **降低维护成本**：良好的文档和测试

所有团队成员都应该熟悉并遵循这些规范。如有疑问或建议，欢迎在团队会议上讨论改进。