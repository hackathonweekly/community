# UI Style Guide — Tailwind Snippet Reference

> AI 辅助开发时，每轮开始请先读此文件。所有 class 可直接复制使用。
> 视觉原型参考: `apps/web/public/ui-design/` 下的 HTML 文件。

## Design Language

**High-Density Neo-Swiss** — 高信息密度，瑞士风格网格，编辑式排版。

---

## 1. Design Tokens

### Colors (Light)
```
Page Background:    bg-[#FAFAFA]          → CSS var: --background
Card Background:    bg-white              → CSS var: --card
Border:             border-gray-200       → CSS var: --border (#E5E7EB)
Text Primary:       text-black            → CSS var: --foreground
Text Secondary:     text-gray-500         → #6B7280
Text Muted:         text-gray-400
Subtle Fill:        bg-gray-50            → #F9FAFB
CTA Primary:        bg-black text-white
```

### Colors (Dark)
```
Page Background:    bg-[#0A0A0A]
Card Background:    bg-[#141414]
Border:             border-[#262626]
Text Primary:       text-white
Text Secondary:     text-[#A3A3A3]
CTA Primary:        bg-white text-black
```

### Typography
```
Heading Font:       font-brand            → Space Grotesk
Body Font:          font-sans             → Inter
Code/Meta Font:     font-mono             → JetBrains Mono
```

### Spacing
```
Card Padding:       p-3                   → 12px (紧凑)
Featured Padding:   p-5                   → 20px
Grid Gap:           gap-4                 → 16px
Section Gap:        mb-6 / mb-8
```

### Radius
```
Standard Card:      rounded-lg            → 12px
Featured Card:      rounded-xl            → 16px
Button Pill:        rounded-full          → 9999px
Button Square:      rounded-md            → 8px
Tag/Badge:          rounded-md            → 8px
Inner Element:      rounded-md / rounded-lg
```

### Shadows
```
Subtle:             shadow-sm             → 0 1px 2px rgba(0,0,0,0.05)
Lift (hover):       shadow-md + translateY(-2px)
```

---

## 2. Layout — Desktop Sidebar

桌面端使用固定左侧边栏，不是顶部导航栏。

```html
<!-- 整体布局 -->
<div class="flex min-h-screen">
  <!-- Desktop Sidebar: 固定左侧 -->
  <aside class="hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 border-r border-gray-200 bg-white z-50 px-4 py-5">
    <!-- Logo -->
    <div class="font-brand text-xl font-bold mb-6 tracking-tight pl-2">
      Hackathon<span class="text-gray-400">.Weekly</span>
    </div>
    <!-- Nav Items -->
    <nav class="space-y-1 flex-1">
      <!-- Active -->
      <a class="flex items-center gap-3 px-3 py-2 rounded-md bg-black text-white text-sm font-medium">
        <Icon class="w-5 text-center" /> Label
      </a>
      <!-- Inactive -->
      <a class="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-black text-sm font-medium transition-colors">
        <Icon class="w-5 text-center" /> Label
      </a>
    </nav>
  </aside>

  <!-- Main Content: 左偏移 sidebar 宽度 -->
  <main class="flex-1 lg:pl-60 w-full">
    <!-- 内容区 -->
    <div class="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
      ...
    </div>
  </main>
</div>
```

## 3. Layout — Mobile

```html
<!-- Mobile Top Header: sticky, h-12 -->
<div class="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2 flex justify-between items-center h-12">
  <div class="font-brand text-lg font-bold">Hackathon.Weekly</div>
  <div class="w-7 h-7 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
    <!-- avatar -->
  </div>
</div>

<!-- Mobile Bottom Nav: fixed, h-14 -->
<div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 h-14 flex justify-around items-center z-50 px-2">
  <!-- Active -->
  <a class="flex flex-col items-center justify-center w-14 h-full text-black">
    <Icon class="text-lg mb-0.5" />
    <span class="text-[9px] font-bold">Label</span>
  </a>
  <!-- Inactive -->
  <a class="flex flex-col items-center justify-center w-14 h-full text-gray-400 hover:text-gray-600">
    <Icon class="text-lg mb-0.5" />
    <span class="text-[9px] font-bold">Label</span>
  </a>
</div>
```

---

## 4. Page Header

```html
<!-- 页面标题区: 左对齐, font-brand -->
<div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-3">
  <h1 class="font-brand text-2xl lg:text-3xl font-bold tracking-tight leading-none text-black">
    Page Title
  </h1>
  <!-- 右侧放 Tabs 或 Filter -->
</div>
```

---

## 5. Tabs (Segmented Control)

```html
<div class="flex gap-1 overflow-x-auto no-scrollbar pb-1 text-sm bg-gray-100/50 p-1 rounded-lg">
  <!-- Active -->
  <button class="px-3 py-1 bg-white text-black rounded-md font-bold text-xs shadow-sm border border-gray-200">
    Active
  </button>
  <!-- Inactive -->
  <button class="px-3 py-1 text-gray-500 rounded-md font-medium text-xs hover:bg-gray-200/50 hover:text-black transition-colors">
    Inactive
  </button>
</div>
```

---

## 6. Card — Standard (Vertical)

用于 Event/Project 列表卡片。

```html
<div class="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer flex flex-col">
  <!-- Image: 固定 h-32 -->
  <div class="h-32 overflow-hidden relative border-b border-gray-50">
    <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
    <!-- 左下角 Tag -->
    <div class="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight text-gray-800 border border-gray-200">
      Tag
    </div>
  </div>
  <!-- Content: p-3 紧凑 -->
  <div class="p-3 flex-1 flex flex-col">
    <div class="flex justify-between items-start mb-1">
      <h3 class="font-brand text-base font-bold leading-tight group-hover:text-gray-600 transition-colors line-clamp-1">
        Title
      </h3>
      <!-- Status Badge -->
      <div class="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 shrink-0 ml-2">
        Open
      </div>
    </div>
    <!-- Meta: mono, 小字 -->
    <div class="text-[11px] text-gray-500 font-mono mb-2">Feb 28 · 14:00 · Shanghai</div>
    <!-- Footer -->
    <div class="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center">
      <span class="text-[10px] text-gray-400 font-medium">Extra Info</span>
      <div class="flex items-center gap-1 text-[10px] font-bold text-gray-700">
        <UserIcon /> 12
      </div>
    </div>
  </div>
</div>
```

---

## 7. Card — Featured (Horizontal Hero)

用于列表页顶部的 Featured 卡片。

```html
<div class="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm mb-6 hover:shadow-md transition-shadow cursor-pointer group flex flex-col md:flex-row h-auto md:h-64">
  <!-- Image: 左侧 2/5 -->
  <div class="w-full md:w-2/5 h-48 md:h-full relative overflow-hidden">
    <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    <div class="absolute top-3 left-3">
      <span class="bg-black/80 backdrop-blur text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight shadow-sm border border-white/10">
        Featured
      </span>
    </div>
  </div>
  <!-- Content: 右侧 p-4/p-5 -->
  <div class="p-4 md:p-5 flex flex-col justify-center flex-1">
    <div class="flex items-center gap-2 mb-2 text-xs font-mono text-gray-500">
      <span class="text-black font-bold">Feb 24-26</span>
      <span>/</span>
      <span>Location</span>
    </div>
    <h2 class="font-brand text-2xl lg:text-3xl font-bold leading-tight mb-2">Title</h2>
    <p class="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2 md:line-clamp-3">Description</p>
    <div class="mt-auto flex items-center justify-between">
      <!-- Avatars -->
      <div class="flex -space-x-1.5">...</div>
      <button class="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors">
        CTA
      </button>
    </div>
  </div>
</div>
```

---

## 8. Section Divider

```html
<div class="flex items-center gap-3 mb-4">
  <h3 class="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">Section Title</h3>
  <div class="h-px bg-gray-100 flex-1"></div>
</div>
```

---

## 9. Buttons

```html
<!-- Primary Pill (主 CTA) -->
<button class="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors">
  Action
</button>

<!-- Secondary Pill -->
<button class="bg-white border border-gray-200 text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-50">
  Secondary
</button>

<!-- Square Action (sidebar/detail 页) -->
<button class="bg-black text-white px-4 py-2 rounded-md text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors">
  Action
</button>

<!-- Full-width CTA (sidebar) -->
<button class="w-full bg-black text-white py-2.5 rounded-md font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors">
  Register
</button>
```

---

## 10. Status Tags / Badges

```html
<!-- Black (Featured/Major) -->
<span class="px-2 py-0.5 bg-black text-white rounded-md text-[10px] font-bold uppercase tracking-wider">Featured</span>

<!-- Gray (Neutral) -->
<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200">Offline</span>

<!-- Green (Open/Active) -->
<span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-100">Open</span>

<!-- Red (Closed) -->
<span class="px-2 py-0.5 bg-red-50 text-red-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-red-100">Closed</span>

<!-- Orange (Paid/Warning) -->
<span class="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-orange-100">Paid</span>

<!-- Purple (Special) -->
<span class="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-purple-100">$$$</span>
```

---

## 11. Detail Page — Sticky Sidebar

```html
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
  <!-- Left: Content (8 cols) -->
  <div class="lg:col-span-8">
    <!-- Header -->
    <div class="mb-6 pb-6 border-b border-gray-100">
      <div class="flex flex-wrap gap-2 mb-3"><!-- Tags --></div>
      <h1 class="font-brand text-3xl lg:text-5xl font-bold leading-tight mb-3">Title</h1>
      <p class="text-base text-gray-600 leading-relaxed max-w-2xl">Subtitle</p>
    </div>
    <!-- Banner Image -->
    <div class="rounded-xl overflow-hidden shadow-sm border border-gray-200 h-48 lg:h-72 mb-8">
      <img class="w-full h-full object-cover" />
    </div>
    <!-- Content prose -->
    <div class="prose prose-sm prose-gray max-w-none font-sans leading-7">...</div>
  </div>

  <!-- Right: Sticky Sidebar (4 cols, desktop only) -->
  <div class="hidden lg:block lg:col-span-4 relative">
    <div class="sticky top-16 bg-white border border-gray-200 rounded-lg p-5 shadow-sm max-h-[calc(100vh-5rem)] overflow-y-auto">
      <!-- Price -->
      <div class="font-brand text-2xl font-bold mb-4">Free</div>
      <!-- CTA -->
      <button class="w-full bg-black text-white py-2.5 rounded-md font-bold text-sm mb-4">Register</button>
      <!-- Info rows -->
      <div class="space-y-3 text-sm">
        <div class="flex gap-3 items-start p-2 rounded-md hover:bg-gray-50 transition-colors">
          <div class="w-5 text-center text-gray-400 mt-0.5"><Icon /></div>
          <div>
            <div class="font-bold text-xs text-gray-900">Label</div>
            <div class="text-[10px] text-gray-500">Detail</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 12. Meta Data (Mono Style)

```html
<!-- Inline meta -->
<div class="text-[11px] text-gray-500 font-mono">Feb 28 · 14:00 · Shanghai</div>

<!-- Structured meta group -->
<div class="flex items-center text-xs font-mono text-gray-500">
  <span class="text-black font-bold mr-2">Feb 24</span>
  <span class="w-px h-3 bg-gray-200 mx-2"></span>
  <span>Shenzhen</span>
</div>
```

---

## 13. Grid Layouts

```html
<!-- 3-col card grid (responsive) -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- cards -->
</div>

<!-- 2-col content grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <!-- items -->
</div>
```

---

## 14. Dark Mode 规则

所有组件使用 Tailwind `dark:` 前缀。核心映射：
```
bg-white        → dark:bg-[#141414]
bg-[#FAFAFA]    → dark:bg-[#0A0A0A]
border-gray-200 → dark:border-[#262626]
text-black      → dark:text-white
text-gray-500   → dark:text-[#A3A3A3]
bg-black        → dark:bg-white
text-white      → dark:text-black       (仅 CTA 按钮)
bg-gray-50      → dark:bg-[#1A1A1A]
bg-gray-100     → dark:bg-[#1F1F1F]
```

---

## 15. Interactive States 交互状态规范

根据使用场景区分两种切换样式：

### 导航类（页面级切换）

用于 Sidebar、Settings 导航等 **跳转到新 URL** 的场景：

```html
<!-- Active: 黑底白字 -->
<a class="flex items-center gap-3 px-3 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black text-sm font-medium">
  <Icon class="w-5 text-center" /> Label
</a>

<!-- Inactive -->
<a class="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-black dark:text-[#A3A3A3] dark:hover:bg-[#1A1A1A] dark:hover:text-white text-sm font-medium transition-colors">
  <Icon class="w-5 text-center" /> Label
</a>
```

### 内容切换类（Segmented Control / Tabs）

用于 **同一页面内切换内容** 的场景（如 Tab 页、模式切换）：

```html
<!-- Container -->
<div class="flex gap-1 bg-gray-100/50 dark:bg-[#1F1F1F] p-1 rounded-lg">
  <!-- Active: 白底 + border + shadow -->
  <button class="flex-1 px-3 py-1.5 bg-white dark:bg-[#141414] text-black dark:text-white rounded-md font-bold text-xs shadow-sm border border-gray-200 dark:border-[#262626]">
    Active
  </button>
  <!-- Inactive -->
  <button class="flex-1 px-3 py-1.5 text-gray-500 dark:text-[#A3A3A3] rounded-md font-medium text-xs hover:bg-gray-200/50 dark:hover:bg-[#262626] hover:text-black dark:hover:text-white transition-colors">
    Inactive
  </button>
</div>
```

### 使用原则

| 场景 | 样式类型 | 激活状态 |
|------|----------|----------|
| Sidebar 主导航 | 导航类 | 黑底白字 |
| Settings/Admin 侧边导航 | 导航类 | 黑底白字 |
| 页面内 Tab 切换 | 内容切换类 | 白底 + border |
| 登录/注册模式切换 | 内容切换类 | 白底 + border |
| 筛选器切换 | 内容切换类 | 白底 + border |

### Radix Tabs 组件默认样式

`@community/ui/ui/tabs` 已遵循内容切换类规范：
```
TabsList:    bg-muted p-1 rounded-lg border
TabsTrigger: data-[state=active]:bg-card data-[state=active]:border-border data-[state=active]:shadow-subtle
```

---

## 16. CSS Variable Mapping

Style Guide token 与 `theme.css` CSS 变量的对应关系，方便 AI 辅助开发时快速查阅。

### Light Mode

| Token | Tailwind Class | CSS Variable | Hex Value |
|-------|---------------|-------------|-----------|
| Page Background | `bg-background` | `--background` | `#fafafa` |
| Card Background | `bg-card` | `--card` | `#ffffff` |
| Border | `border-border` | `--border` | `#e5e7eb` |
| Text Primary | `text-foreground` | `--foreground` | `#111111` |
| Text Secondary | `text-muted-foreground` | `--muted-foreground` | `#6b7280` |
| Subtle Fill | `bg-muted` | `--muted` | `#f9fafb` |
| CTA Primary BG | `bg-primary` | `--primary` | `#000000` |
| CTA Primary Text | `text-primary-foreground` | `--primary-foreground` | `#ffffff` |
| Sidebar BG | `bg-sidebar` | `--sidebar` | `#ffffff` |
| Sidebar Active BG | `bg-sidebar-accent` | `--sidebar-accent` | `#000000` |
| Sidebar Active Text | `text-sidebar-accent-foreground` | `--sidebar-accent-foreground` | `#ffffff` |

### Dark Mode

| Token | CSS Variable | Hex Value |
|-------|-------------|-----------|
| Page Background | `--background` | `#0a0a0a` |
| Card Background | `--card` | `#141414` |
| Border | `--border` | `#262626` |
| Text Primary | `--foreground` | `#fafafa` |
| Text Secondary | `--muted-foreground` | `#a3a3a3` |
| Subtle Fill | `--muted` | `#1a1a1a` |
| CTA Primary BG | `--primary` | `#ffffff` |
| Sidebar BG | `--sidebar` | `#0a0a0a` |
| Sidebar Active BG | `--sidebar-accent` | `#ffffff` |
| Sidebar Active Text | `--sidebar-accent-foreground` | `#000000` |

---

## 17. Page Container

标准页面容器模式，所有内容页面统一使用：

```html
<div class="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6 pb-20 lg:pb-16">
  <!-- 页面内容 -->
</div>
```

- `max-w-6xl` (1152px) 限制最大宽度
- `px-4 lg:px-8` 移动端 16px / 桌面端 32px 水平内边距
- `py-5 lg:py-6` 顶部间距
- `pb-20 lg:pb-16` 底部留白（移动端为底部导航预留空间）

---

## 18. Empty State

空状态组件的标准样式，用于列表为空、搜索无结果等场景：

```html
<div class="flex flex-col items-center justify-center py-16 text-center">
  <!-- Icon: 使用 muted 色 -->
  <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
    <Icon class="w-6 h-6 text-muted-foreground" />
  </div>
  <!-- 标题 -->
  <h3 class="font-brand text-lg font-bold mb-1 text-foreground">No Items Found</h3>
  <!-- 描述 -->
  <p class="text-sm text-muted-foreground max-w-sm mb-4">Description text explaining why the list is empty.</p>
  <!-- CTA (可选) -->
  <button class="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors">
    Create First Item
  </button>
</div>
```

---

## 19. Settings / Sub-Navigation Layout

设置页面的内部导航布局规范：

### Desktop: 左侧导航 + 右侧内容

```html
<div class="flex gap-8">
  <!-- 左侧导航: 固定宽度 -->
  <nav class="hidden lg:block w-48 shrink-0">
    <div class="sticky top-20 space-y-1">
      <!-- Active -->
      <a class="flex items-center gap-3 px-3 py-2 rounded-md bg-black text-white text-sm font-medium">
        <Icon class="w-4" /> General
      </a>
      <!-- Inactive -->
      <a class="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-black text-sm font-medium transition-colors">
        <Icon class="w-4" /> Members
      </a>
    </div>
  </nav>
  <!-- 右侧内容区 -->
  <div class="flex-1 min-w-0">
    <!-- 表单内容 -->
  </div>
</div>
```

### Mobile: 水平 Tabs

```html
<div class="lg:hidden flex gap-1 overflow-x-auto no-scrollbar pb-1 bg-gray-100/50 p-1 rounded-lg mb-4">
  <button class="px-3 py-1 bg-white text-black rounded-md font-bold text-xs shadow-sm border border-gray-200 whitespace-nowrap">
    General
  </button>
  <button class="px-3 py-1 text-gray-500 rounded-md font-medium text-xs hover:bg-gray-200/50 hover:text-black transition-colors whitespace-nowrap">
    Members
  </button>
</div>
```

---

## 20. shadcn/ui Component Integration

本项目使用 `@community/ui` 包中的 shadcn/ui 组件。样式对齐通过 CSS 变量实现，而非替换组件。

### 原则

1. 不修改 shadcn/ui 组件源码，通过 `theme.css` 中的 CSS 变量控制主题
2. 需要自定义样式时，通过 `className` prop 覆盖
3. 组件的 `variant` 和 `size` props 优先于自定义 className

### 常用覆盖模式

```tsx
// 使用 CSS 变量自动适配主题
<Button variant="default">  {/* 自动使用 --primary / --primary-foreground */}

// 通过 className 微调
<Card className="shadow-none border-0">  {/* 去掉默认阴影和边框 */}

// Sidebar 组件已通过 --sidebar-* 变量控制
// 激活态: --sidebar-accent (黑底) + --sidebar-accent-foreground (白字)
// Hover 态: 使用 bg-muted 而非 bg-sidebar-accent，避免与激活态冲突
```

### 关键 CSS 变量映射

```
shadcn/ui Token     → theme.css Variable
--primary           → #000000 (light) / #ffffff (dark)
--secondary         → #f3f4f6 (light) / #1a1a1a (dark)
--muted             → #f9fafb (light) / #1a1a1a (dark)
--sidebar-accent    → #000000 (light) / #ffffff (dark)  ← 激活态
```
