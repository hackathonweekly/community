# 黑客松活动优化改进文档

## 项目背景

当前黑客松活动功能完善但存在以下痛点：
1. 手机端体验不佳，信息层次混乱
2. 阶段管理过于复杂，需要手动切换
3. 作品展示与投票体验割裂
4. 缺少路演模式支持
5. 管理后台配置项过多，使用门槛高

**开发时间限制**：约1小时
**优化原则**：在不引入bug的前提下，实现最大价值改进

---

## 一、现有代码问题分析

### 1.1 活动详情页问题 (HackathonContent.tsx)

**当前实现**：
- 5个Tab：概览、作品、资源、奖项、结果
- 5个阶段状态显示在页面顶部
- 底部操作栏根据阶段动态显示

**存在问题**：
```typescript
// 问题1: Tab栏目过多且位置不合理
<TabsList className="grid w-full grid-cols-5">
  <TabsTrigger value="overview">概览</TabsTrigger>
  <TabsTrigger value="projects">作品</TabsTrigger>
  <TabsTrigger value="resources">资源</TabsTrigger>  // 冗余
  <TabsTrigger value="awards">奖项</TabsTrigger>     // 冗余
  <TabsTrigger value="results">结果</TabsTrigger>
</TabsList>

// 问题2: 阶段显示占用大量空间 (第212-246行)
{stageOrder.map((stage, index) => (
  // 显示5个阶段的完整流程图
))}

// 问题3: 底部操作栏逻辑复杂 (第346-388行)
// 需要判断用户状态、阶段、时间窗口等
```

**影响**：
- 手机端屏幕小，5个Tab + 阶段流程图占用过多空间
- 用户需要来回切换Tab才能完成操作
- 资源和奖项信息可以内联到概览中

### 1.2 作品广场问题 (EventSubmissionsGallery.tsx)

**当前实现**：
- 独立页面展示作品列表
- 点击作品卡片跳转到详情页
- 投票按钮在详情页内

**存在问题**：
```typescript
// 问题1: 投票需要跳转到详情页
<Link href={`/events/${eventId}/submissions/${submission.id}`}>
  // 整个卡片是链接，无法直接投票
</Link>

// 问题2: 没有实时排名展示
// 只在RESULTS阶段显示前3名徽章

// 问题3: 不支持编辑自己的作品
// 必须回到管理后台才能编辑
```

**影响**：
- 用户体验割裂，投票流程过长
- 缺少竞争氛围，不够刺激
- 作者编辑作品路径不直观

### 1.3 阶段管理问题 (HackathonManagement.tsx)

**当前实现**：
- 5个阶段：REGISTRATION → DEVELOPMENT → SUBMISSION → VOTING → RESULTS
- 需要管理员手动切换阶段
- 阶段控制在独立的Card中

**存在问题**：
```typescript
// 问题1: Tab栏过多 (第512-542行)
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="settings">基本设置</TabsTrigger>
  <TabsTrigger value="voting">投票设置</TabsTrigger>
  <TabsTrigger value="awards">奖项设置</TabsTrigger>
  <TabsTrigger value="resources">资源管理</TabsTrigger>
</TabsList>

// 问题2: 专家投票权重配置 (第654-674行)
<Label htmlFor="enableJudgeVoting">开启专家评审</Label>
<Switch id="enableJudgeVoting" />
// 对于简单的黑客松活动，这个功能过于复杂

// 问题3: 奖项配置过于灵活 (第753-879行)
// 支持添加任意奖项、设置类型、获奖数等
// 但大多数活动只需要一二三等奖
```

**影响**：
- 配置流程复杂，学习成本高
- 很多功能对简单黑客松是过度设计
- 手动切换阶段容易忘记

### 1.4 路演模式缺失

**当前状态**：完全没有路演模式功能

**期望功能**：
- 2/3屏幕显示作品详情（大图、视频、描述）
- 1/3屏幕实时显示：
  - 投票排名动态更新
  - 观众评论实时滚动
  - 投票数增长动画

**技术挑战**：
- 需要WebSocket或轮询实现实时更新
- 需要新的布局组件
- 需要倒计时功能

---

## 二、优化方案设计

### 2.1 【P0】手机端活动详情页优化

**文件**：`src/app/(public)/[locale]/events/[eventId]/components/HackathonContent.tsx`

**改动内容**：

#### 改动1: 简化Tab栏（删除资源、奖项）
```typescript
// 从5个Tab减少到3个Tab
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="info">活动信息</TabsTrigger>
  <TabsTrigger value="participants">参与者</TabsTrigger>
  <TabsTrigger value="projects">作品广场</TabsTrigger>
</TabsList>
```

**理由**：
- 资源可以内联到"活动信息"Tab的底部
- 奖项信息默认为一二三等奖，无需单独Tab
- 结果阶段直接显示在"作品广场"Tab内

#### 改动2: 移除阶段流程图显示
```typescript
// 删除第212-246行的阶段流程图
// 改为在页面顶部显示简单的阶段Badge

<div className="mb-4">
  <Badge variant="outline">
    当前阶段: {currentStageLabel}
  </Badge>
</div>
```

**理由**：
- 手机端空间宝贵，完整流程图占用过多空间
- 普通用户只需要知道当前阶段，不需要看到所有阶段
- 管理员在后台管理页查看详细流程

#### 改动3: 简化底部操作栏
```typescript
// 只保留"提交作品"按钮，根据用户状态显示
{isUserRegistered && isSubmissionWindow && (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
    <Button className="w-full" onClick={handleSubmit}>
      {userHasSubmission ? "编辑我的作品" : "提交作品"}
    </Button>
  </div>
)}
```

**风险评估**：
- ✅ 低风险：只是UI调整，不改变逻辑
- 工作量：20分钟

---

### 2.2 【P0】作品广场优化（核心功能）

**文件**：`src/modules/public/events/submissions/EventSubmissionsGallery.tsx`

**改动内容**：

#### 改动1: 列表中直接投票（取消跳转）
```typescript
// 修改作品卡片，从Link改为div，内部按钮可点击
<div className="border rounded-lg p-4">
  <Link href={`/submissions/${submission.id}`}>
    <h3>{submission.title}</h3>
    <p>{submission.description}</p>
  </Link>

  {/* 投票按钮独立出来 */}
  <div className="flex items-center gap-2 mt-4" onClick={e => e.stopPropagation()}>
    <VoteButton
      submissionId={submission.id}
      voteCount={submission.voteCount}
      hasVoted={submission.hasVoted}
    />
    {isOwnSubmission && (
      <Button size="sm" variant="outline" onClick={handleEdit}>
        编辑
      </Button>
    )}
  </div>
</div>
```

#### 改动2: 桌面端双栏布局（左作品右排名）
```typescript
// 添加响应式布局
<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
  {/* 左侧：作品列表 */}
  <div className="space-y-4">
    {submissions.map(sub => <SubmissionCard />)}
  </div>

  {/* 右侧：实时排名 */}
  <div className="hidden lg:block sticky top-4">
    <Card>
      <CardHeader>
        <CardTitle>实时排名</CardTitle>
      </CardHeader>
      <CardContent>
        <LiveRanking submissions={submissions} />
      </CardContent>
    </Card>
  </div>
</div>
```

#### 改动3: 实时更新投票排名
```typescript
// 使用现有的轮询机制（已有usePageVisibility）
// 增加投票数变化动画
const [previousVotes, setPreviousVotes] = useState({});

useEffect(() => {
  if (submissions) {
    submissions.forEach(sub => {
      if (previousVotes[sub.id] !== sub.voteCount) {
        // 触发动画
        animateVoteChange(sub.id);
      }
    });
    setPreviousVotes(
      Object.fromEntries(submissions.map(s => [s.id, s.voteCount]))
    );
  }
}, [submissions]);
```

**风险评估**：
- ⚠️ 中风险：需要修改投票按钮逻辑，测试多场景
- 工作量：25分钟

---

### 2.3 【P1】管理后台简化（快速实现）

**文件**：`src/modules/dashboard/events/components/HackathonManagement.tsx`

**改动内容**：

#### 改动1: 移除Tab栏，单页显示所有配置
```typescript
// 删除第512-542行的Tabs组件
// 改为垂直排列的Card

<div className="space-y-6">
  {/* 阶段控制卡片（保留） */}
  <Card>...</Card>

  {/* 合并后的配置卡片 */}
  <Card>
    <CardHeader>
      <CardTitle>黑客松配置</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* 基本设置 */}
      <section>
        <h3>团队设置</h3>
        <div>最大团队规模、允许个人参赛</div>
      </section>

      {/* 简化的投票设置 */}
      <section>
        <h3>投票设置</h3>
        <div>只保留"开启公众投票"开关</div>
      </section>

      {/* 默认奖项：不可配置 */}
      <section>
        <h3>奖项设置</h3>
        <p className="text-muted-foreground">
          默认奖项：一等奖（1名）、二等奖（2名）、三等奖（3名）
        </p>
      </section>
    </CardContent>
  </Card>
</div>
```

#### 改动2: 移除专家投票配置
```typescript
// 删除第654-674行的专家投票配置
// 删除第676-747行的权重配置
// 在config中硬编码默认值
const DEFAULT_VOTING_CONFIG = {
  allowPublicVoting: true,
  enableJudgeVoting: false,  // 默认禁用
  publicVotingScope: "PARTICIPANTS"
};
```

#### 改动3: 移除资源管理Tab
```typescript
// 删除第881-1007行的资源管理代码
// 资源可以通过活动富文本描述添加链接
```

**风险评估**：
- ✅ 低风险：只是隐藏配置项，不影响已有数据
- 工作量：15分钟

---

### 2.4 【P2】路演模式（可选，时间允许时实现）

**新增文件**：`src/modules/public/events/submissions/PresentationMode.tsx`

**功能设计**：

#### 核心功能
1. **全屏布局**：2/3作品展示 + 1/3实时信息
2. **倒计时功能**：可设置每个作品展示时间（如5分钟）
3. **自动切换**：倒计时结束自动切换到下一个作品
4. **实时信息**：投票数、排名、评论滚动

#### 技术实现
```typescript
export function PresentationMode({ eventId, submissions }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5分钟
  const [isRunning, setIsRunning] = useState(false);

  // 倒计时逻辑
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 自动切换到下一个
          setCurrentIndex(i => (i + 1) % submissions.length);
          return 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  // 实时数据轮询
  useQuery({
    queryKey: ['live-stats', eventId],
    queryFn: () => fetchLiveStats(eventId),
    refetchInterval: 2000 // 2秒刷新
  });

  return (
    <div className="fixed inset-0 bg-black z-50 grid grid-cols-[2fr_1fr]">
      {/* 左侧：作品展示 */}
      <div className="flex flex-col items-center justify-center p-8 bg-gray-900">
        <SubmissionDisplay submission={submissions[currentIndex]} />

        {/* 倒计时 */}
        <div className="absolute top-4 right-4 text-white text-4xl font-mono">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* 右侧：实时信息 */}
      <div className="bg-gray-800 text-white p-6 overflow-y-auto">
        {/* 实时排名 */}
        <section className="mb-8">
          <h3 className="text-xl font-bold mb-4">实时排名</h3>
          <LiveLeaderboard />
        </section>

        {/* 评论滚动 */}
        <section>
          <h3 className="text-xl font-bold mb-4">观众评论</h3>
          <CommentStream eventId={eventId} />
        </section>
      </div>

      {/* 底部控制栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 p-4 flex gap-4">
        <Button onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? '暂停' : '开始'}
        </Button>
        <Button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}>
          上一个
        </Button>
        <Button onClick={() => setCurrentIndex(i => Math.min(submissions.length - 1, i + 1))}>
          下一个
        </Button>
        <Button onClick={onExit}>退出路演模式</Button>
      </div>
    </div>
  );
}
```

**入口点**：在作品广场页面添加"路演模式"按钮
```typescript
// EventSubmissionsGallery.tsx
{isOrganizer && (
  <Button onClick={() => setShowPresentation(true)}>
    🎤 进入路演模式
  </Button>
)}
```

**风险评估**：
- ⚠️ 高风险：新功能，需要充分测试
- 工作量：40分钟（超时）
- **建议**：如果时间不够，本功能可以放到下一期迭代

---

## 三、实现优先级（基于1小时限制）

### 优先级矩阵

| 功能 | 价值 | 风险 | 工作量 | 优先级 |
|------|------|------|--------|--------|
| 简化活动详情Tab | 高 | 低 | 20min | P0 ✅ |
| 作品列表直接投票 | 高 | 中 | 25min | P0 ✅ |
| 简化管理后台 | 中 | 低 | 15min | P1 ✅ |
| 路演模式 | 高 | 高 | 40min | P2 ❌ |

### 推荐实施方案（1小时）

**阶段1: 前20分钟 - 活动详情页优化**
- 修改 `HackathonContent.tsx`
- 删除资源、奖项Tab
- 移除阶段流程图
- 简化底部操作栏
- **交付物**：手机端体验优化完成

**阶段2: 前45分钟 - 作品广场优化**
- 修改 `EventSubmissionsGallery.tsx`
- 实现列表内投票按钮
- 添加桌面端双栏布局
- 添加投票动画效果
- **交付物**：作品投票体验优化完成

**阶段3: 前60分钟 - 管理后台简化**
- 修改 `HackathonManagement.tsx`
- 移除Tab栏，改为单页布局
- 删除专家投票配置
- 删除资源管理Tab
- **交付物**：管理后台简化完成

**路演模式**：建议放到下一期迭代（需要2-3小时开发+测试）

---

## 四、阶段管理自动化方案（补充）

基于用户反馈"不需要手动切换阶段"，提供自动化方案：

### 方案1: 基于活动时间自动切换（推荐）

**实现逻辑**：
```typescript
// 在 HackathonContent.tsx 的 fallbackStage 逻辑中
const getAutoStage = (event: Event): HackathonStage => {
  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  // 活动开始前：报名阶段
  if (now < start) {
    return "REGISTRATION";
  }

  // 活动进行中：根据时间比例判断
  if (now >= start && now <= end) {
    const duration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = elapsed / duration;

    if (progress < 0.7) return "DEVELOPMENT";
    if (progress < 0.9) return "SUBMISSION";
    return "VOTING";
  }

  // 活动结束后：结果阶段
  return "RESULTS";
};
```

**优点**：
- 无需手动干预
- 根据活动时间自动推进
- 适合标准流程的黑客松

**缺点**：
- 缺乏灵活性
- 某些活动可能需要提前结束某阶段

### 方案2: 保留手动控制 + 添加"一键开始"按钮

**实现逻辑**：
```typescript
// 在管理后台添加快捷操作
<div className="flex gap-2">
  <Button onClick={() => updateStage("DEVELOPMENT")}>
    ▶️ 开始开发阶段
  </Button>
  <Button onClick={() => updateStage("VOTING")}>
    📊 开始投票
  </Button>
  <Button onClick={() => updateStage("RESULTS")}>
    🏆 公布结果
  </Button>
</div>
```

**优点**：
- 灵活控制
- 适合特殊情况
- 一键操作，降低复杂度

**推荐**：使用方案2，保留灵活性但简化操作

---

## 五、技术风险评估

### 5.1 潜在Bug风险

| 风险点 | 影响 | 缓解措施 |
|--------|------|----------|
| 投票按钮与卡片点击冲突 | 点击投票时可能跳转 | 使用 `e.stopPropagation()` |
| 实时轮询导致性能问题 | 页面卡顿 | 限制轮询频率为2秒，页面不可见时停止 |
| Tab减少导致路由404 | 旧链接失效 | 添加重定向逻辑 |
| 移除配置项后已有数据读取失败 | 后台报错 | 使用 `withHackathonConfigDefaults` 填充默认值 |

### 5.2 兼容性考虑

- **数据库兼容**：不修改schema，只调整前端显示
- **API兼容**：不修改API接口，只改变调用逻辑
- **浏览器兼容**：使用现有UI组件，无需新CSS特性

### 5.3 测试重点

1. **投票功能**：
   - 已投票用户不能重复投票
   - 投票数实时更新
   - 投票后可以取消

2. **编辑功能**：
   - 只有作品所有者能看到编辑按钮
   - 编辑跳转到正确的表单页

3. **移动端布局**：
   - Tab栏正常显示
   - 底部按钮不遮挡内容
   - 滚动性能正常

---

## 六、下一期迭代计划（路演模式）

如果本次没有时间实现路演模式，下次可以这样规划：

### 阶段1: 数据准备（30分钟）
- 创建实时统计API：`/api/events/:id/live-stats`
- 返回数据：排名、投票数、最新评论

### 阶段2: UI开发（60分钟）
- 创建 `PresentationMode.tsx`
- 实现全屏布局
- 添加倒计时组件
- 集成实时数据

### 阶段3: 交互优化（30分钟）
- 添加键盘快捷键（←→切换作品）
- 优化动画效果
- 添加声音提示（可选）

### 阶段4: 测试与修复（30分钟）
- 测试多个作品切换
- 测试倒计时准确性
- 测试实时数据更新

**总计**：约2.5小时

---

## 七、总结与建议

### 7.1 本次优化重点

1. **手机端体验优化**：简化Tab栏，聚焦核心功能
2. **投票体验提升**：列表内直接投票，降低操作成本
3. **管理简化**：减少配置项，降低使用门槛

### 7.2 未完成功能

- **路演模式**：建议下次迭代实现，是高价值功能

### 7.3 技术债务

- 评论功能目前不完善，路演模式依赖评论实时滚动
- 需要考虑是否引入WebSocket替代轮询

### 7.4 关键指标

优化后应关注的数据：
- 投票转化率（浏览作品 → 投票的比例）
- 作品编辑率（作者点击编辑的比例）
- 移动端跳出率（是否因体验差而退出）

---

## 附录：文件清单

### 需要修改的文件

1. `src/app/(public)/[locale]/events/[eventId]/components/HackathonContent.tsx`
   - 简化Tab栏
   - 移除阶段流程图
   - 优化底部操作栏

2. `src/modules/public/events/submissions/EventSubmissionsGallery.tsx`
   - 添加列表内投票按钮
   - 实现桌面端双栏布局
   - 添加投票动画

3. `src/modules/dashboard/events/components/HackathonManagement.tsx`
   - 移除Tab栏
   - 简化配置项
   - 优化阶段控制

### 需要新建的文件（下期）

1. `src/modules/public/events/submissions/PresentationMode.tsx`
   - 路演模式主组件

2. `src/server/routes/live-stats.ts`
   - 实时统计API

---

**文档版本**: v1.0
**创建时间**: 2025-11-28
**预计开发时间**: 1小时（不含路演模式）
**下期迭代时间**: 2.5小时（路演模式）
