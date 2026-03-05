# 支付流程优化 - 任务清单

## P0 - 必须修复

- [x] 管理后台支持 PENDING_PAYMENT 状态
  - [x] EventRegistrationsTab.tsx 添加状态颜色映射
  - [x] 状态筛选器添加"待支付"选项
  - [x] i18n 添加状态文案

- [x] 待支付订单恢复机制
  - [x] orders.ts 修改创建订单逻辑，复用未过期订单
  - [x] orders.ts 自动取消已过期订单
  - [x] EventRegistrationModal.tsx 处理已有订单的恢复

## P1 - 体验优化

- [x] 支付弹窗交互优化
  - [x] PaymentModal.tsx 添加支付状态指示器
  - [x] PaymentModal.tsx 添加"我已支付"按钮
  - [x] PaymentModal.tsx 倒计时警告样式
  - [x] PaymentModal.tsx 支付成功延迟关闭

- [x] 主动查询微信支付状态
  - [x] wechatpay/index.ts 添加 queryWechatOrderStatus 函数
  - [x] orders.ts 添加 POST /:orderId/query 接口
  - [x] PaymentModal.tsx 调用查询接口

## P2 - 增强功能

- [x] 管理后台显示订单详情
  - [x] RegistrationDetailsDialog 显示关联订单信息
  - [x] 支持管理员手动标记支付状态（特殊情况）

- [x] 国际化完善
  - [x] zh.json 添加新文案
  - [x] en.json 添加新文案
