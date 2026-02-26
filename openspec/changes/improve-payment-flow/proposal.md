# 支付流程优化提案

## 问题背景

用户反馈支付流程交互不佳：
1. 扫码支付后无反馈，用户无法确认是否成功
2. 关闭页面后重新点击支付，系统提示"已报名"，但后台未显示通过状态
3. 管理员后台无法正确显示待支付状态

## 根本原因

1. **管理后台缺少 `PENDING_PAYMENT` 状态处理** - 状态颜色映射和筛选器都没有这个状态
2. **重复下单逻辑过于严格** - 检测到任何非取消状态的报名就阻止，没有考虑待支付场景
3. **缺少待支付订单恢复机制** - 用户关闭弹窗后无法继续支付
4. **支付状态反馈不明确** - 轮询检测时没有清晰的视觉提示

## 优化方案

### 1. 管理后台支持 PENDING_PAYMENT 状态

**文件**: `src/modules/dashboard/events/components/EventRegistrationsTab.tsx`

- 在 `registrationStatusColors` 添加 `PENDING_PAYMENT` 状态样式（橙色，带钱包图标）
- 在状态筛选器添加"待支付"选项
- 显示关联的订单信息（订单号、金额、过期时间）

### 2. 待支付订单恢复机制

**文件**: `src/server/routes/events/orders.ts`

- 新增 `GET /:eventId/orders/pending` 接口，查询用户未过期的待支付订单
- 修改创建订单逻辑：
  - 如果存在未过期的 `PENDING` 订单，返回该订单信息而非报错
  - 如果订单已过期，自动取消后允许重新创建

**文件**: `src/modules/public/events/components/EventRegistrationModal.tsx`

- 在打开弹窗时检查是否有待支付订单
- 如果有，直接打开 `PaymentModal` 继续支付
- 提供"取消订单重新报名"的选项

### 3. 改进支付弹窗交互

**文件**: `src/modules/public/events/components/PaymentModal.tsx`

- 添加支付状态指示器：
  - "等待扫码" - 显示二维码
  - "检测支付中..." - 扫码后的轮询状态
  - "支付成功" - 绿色成功提示
- 添加"我已支付，查询结果"按钮，手动触发状态检查
- 优化倒计时显示，剩余时间少于 5 分钟时变红色警告
- 支付成功后延迟 2 秒自动关闭，给用户确认时间

### 4. 主动查询微信支付状态

**文件**: `packages/lib-server/src/payments/provider/wechatpay/index.ts`

- 新增 `queryWechatOrderStatus` 函数，主动查询微信支付订单状态
- 用于"我已支付"按钮的手动查询

**文件**: `src/server/routes/events/orders.ts`

- 新增 `POST /:eventId/orders/:orderId/query` 接口
- 调用微信支付查询接口，如果已支付则更新订单状态

## 实施优先级

1. **P0 - 管理后台状态显示** - 让管理员能看到正确的状态
2. **P0 - 待支付订单恢复** - 解决用户无法继续支付的问题
3. **P1 - 支付弹窗交互优化** - 改善用户体验
4. **P1 - 主动查询支付状态** - 解决 webhook 延迟或失败的问题

## 影响范围

- 前端：EventRegistrationsTab, EventRegistrationModal, PaymentModal
- 后端：events/orders.ts, wechatpay/index.ts
- 数据库：无 schema 变更

## 测试要点

1. 管理后台能正确显示和筛选 PENDING_PAYMENT 状态
2. 用户关闭支付弹窗后重新点击报名，能继续之前的订单
3. 订单过期后能正常重新创建
4. "我已支付"按钮能正确查询并更新状态
5. 支付成功后前端能及时收到反馈
