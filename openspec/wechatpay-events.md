# 微信支付活动门票功能实现方案

## 1. 需求总结

### 1.1 功能范围
- **支付类型**: 一次性支付（活动门票），订阅功能后续再做
- **支付产品**:
  - Native 支付（PC 端扫码）- 弹窗显示二维码
  - JSAPI 支付（微信内网页）- 用户在微信浏览器内打开时使用
- **报名流程**: **先报名后支付** - 用户先填写报名信息，提交后立即弹出支付二维码
- **报名状态**: 新增 `PENDING_PAYMENT` 状态，支付成功后根据活动 `requireApproval` 字段变为 `APPROVED` 或 `PENDING`
- **订单模型**: 新建 `EventOrder` 模型专门处理活动支付
- **退款**: 仅支持管理员在后台手动发起退款
- **支付超时**: 30 分钟未支付自动取消订单和报名记录，用户需重新填写报名信息
- **库存锁定**: 报名提交即锁定库存，超时未支付自动释放
- **支付通知**: 支付成功后发送邮件通知用户

### 1.2 技术约束
- 微信支付商户号、API v3 密钥、商户证书已准备好（证书私钥存储在环境变量中）
- 复用现有的 `PaymentProvider` 抽象层
- 与现有 `EventRegistration` 模型关联
- JSAPI 支付授权目录需要在微信公众号后台配置（待配置）

---

## 2. 数据库模型设计

### 2.1 修改 RegistrationStatus 枚举

在现有的 `RegistrationStatus` 枚举中新增 `PENDING_PAYMENT` 状态：

```prisma
enum RegistrationStatus {
  PENDING_PAYMENT  // 新增：待支付
  PENDING          // 待审核
  APPROVED         // 已通过
  WAITLISTED       // 候补
  REJECTED         // 已拒绝
  CANCELLED        // 已取消
}
```

### 2.2 新增 EventOrder 模型

```prisma
// 活动订单状态
enum EventOrderStatus {
  PENDING        // 待支付
  PAID           // 已支付
  CANCELLED      // 已取消（超时/用户取消）
  REFUNDED       // 已退款
  REFUND_PENDING // 退款中
}

// 支付方式
enum PaymentMethod {
  WECHAT_NATIVE  // 微信 Native 支付（扫码）
  WECHAT_JSAPI   // 微信 JSAPI 支付（公众号内）
  STRIPE         // Stripe 支付
  FREE           // 免费（价格为0）
}

model EventOrder {
  id                String           @id @default(cuid())
  orderNo           String           @unique  // 订单号（用于微信支付）

  // 关联信息
  eventId           String
  userId            String
  ticketTypeId      String
  registrationId    String           @unique  // 关联的报名记录（报名时创建）

  // 订单信息
  quantity          Int              @default(1)  // 购买数量
  unitPrice         Float            // 单价（下单时快照）
  totalAmount       Float            // 总金额（分）
  currency          String           @default("CNY")

  // 支付信息
  status            EventOrderStatus @default(PENDING)
  paymentMethod     PaymentMethod?
  transactionId     String?          // 微信支付交易号
  paidAt            DateTime?

  // 微信支付相关
  prepayId          String?          // 预支付交易会话标识
  codeUrl           String?          // Native 支付二维码链接

  // 退款信息
  refundId          String?          // 退款单号
  refundAmount      Float?           // 退款金额
  refundedAt        DateTime?
  refundReason      String?
  refundedBy        String?          // 退款操作人

  // 超时控制
  expiredAt         DateTime         // 订单过期时间（30分钟）

  // 时间戳
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  // 关系
  event             Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  ticketType        EventTicketType  @relation(fields: [ticketTypeId], references: [id])
  registration      EventRegistration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  refunder          User?            @relation("RefundedOrders", fields: [refundedBy], references: [id])

  @@index([orderNo])
  @@index([userId, status])
  @@index([eventId, status])
  @@index([status, expiredAt])  // 用于超时订单查询
  @@map("event_order")
}
```

### 2.3 修改现有模型

**EventTicketType** - 添加关系：
```prisma
model EventTicketType {
  // ... 现有字段
  orders          EventOrder[]  // 新增
}
```

**EventRegistration** - 添加关系：
```prisma
model EventRegistration {
  // ... 现有字段
  order           EventOrder?   // 新增：关联的支付订单（一对一）
}
```

**User** - 添加关系：
```prisma
model User {
  // ... 现有字段
  eventOrders         EventOrder[]
  refundedEventOrders EventOrder[] @relation("RefundedOrders")
}
```

**Event** - 添加关系：
```prisma
model Event {
  // ... 现有字段
  orders          EventOrder[]  // 新增
}
```

---

## 3. 微信支付 SDK 集成

### 3.1 推荐使用的 npm 包

```bash
bun add wechatpay-node-v3
```

`wechatpay-node-v3` 是微信支付官方推荐的 Node.js SDK，支持 API v3 接口。

### 3.2 环境变量配置

```env
# 微信支付配置
WECHAT_PAY_MCH_ID=商户号
WECHAT_PAY_API_KEY_V3=APIv3密钥
WECHAT_PAY_SERIAL_NO=商户证书序列号
WECHAT_PAY_PRIVATE_KEY=商户私钥（PEM格式，可以是文件路径或内容）
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/webhooks/wechatpay

# 微信公众号配置（JSAPI 支付需要）
WECHAT_SERVICE_ACCOUNT_APP_ID=公众号AppID
```

### 3.3 配置文件更新

`src/config/index.ts`:
```typescript
payments: {
  providers: {
    stripe: {
      enabled: true,
    },
    wechatpay: {
      enabled: true,
      orderExpireMinutes: 30,  // 订单过期时间
    },
  },
}
```

---

## 4. API 设计

### 4.1 新增 API 端点

#### 创建订单
```
POST /api/events/:eventId/orders
```

请求体：
```typescript
{
  ticketTypeId: string;
  quantity?: number;  // 默认 1
}
```

响应：
```typescript
{
  success: true;
  data: {
    orderId: string;
    orderNo: string;
    totalAmount: number;
    expiredAt: string;
    // Native 支付返回
    codeUrl?: string;
    // JSAPI 支付返回
    jsapiParams?: {
      appId: string;
      timeStamp: string;
      nonceStr: string;
      package: string;
      signType: string;
      paySign: string;
    };
  }
}
```

#### 查询订单状态
```
GET /api/events/:eventId/orders/:orderId
```

响应：
```typescript
{
  success: true;
  data: {
    id: string;
    orderNo: string;
    status: EventOrderStatus;
    totalAmount: number;
    paidAt?: string;
    expiredAt: string;
    registration?: EventRegistration;
  }
}
```

#### 取消订单（用户主动取消）
```
POST /api/events/:eventId/orders/:orderId/cancel
```

#### 管理员退款
```
POST /api/events/:eventId/orders/:orderId/refund
```

请求体：
```typescript
{
  reason: string;
  amount?: number;  // 可选，默认全额退款
}
```

#### 获取用户订单列表
```
GET /api/events/:eventId/orders
```

### 4.2 Webhook 端点

```
POST /api/webhooks/wechatpay
```

处理微信支付回调通知。

---

## 5. 前端流程设计

### 5.1 整体流程（先报名后支付）

```
用户填写报名表单 → 选择付费票种 → 点击"提交报名"
                                        ↓
                              创建报名记录（PENDING_PAYMENT）
                              创建订单 + 锁定库存
                                        ↓
                              ┌─────────┴─────────┐
                              ↓                   ↓
                         PC 浏览器            微信浏览器
                              ↓                   ↓
                      弹出二维码弹窗        调用 JSAPI 支付
                      轮询订单状态              ↓
                              ↓           支付成功/取消
                      支付成功/超时              ↓
                              └─────────┬─────────┘
                                        ↓
                    支付成功 → 更新报名状态 → 显示成功页面
                    支付超时 → 取消订单和报名 → 提示重新报名
```

### 5.2 Native 支付流程（PC 端）

**二维码弹窗组件功能**：
- 显示二维码（使用 `qrcode.react` 生成）
- 显示倒计时（30分钟）
- 轮询订单状态（每 3 秒）
- 支持手动刷新二维码（重新生成订单）
- 支持取消支付（取消订单和报名）
- 支付成功后自动关闭弹窗，显示成功提示

### 5.3 JSAPI 支付流程（微信内）

**检测微信环境**：
```typescript
const isWechat = /MicroMessenger/i.test(navigator.userAgent);
```

**JSAPI 支付调用**：
```typescript
function invokeWechatPay(params: JSAPIParams) {
  return new Promise((resolve, reject) => {
    WeixinJSBridge.invoke('getBrandWCPayRequest', params, (res) => {
      if (res.err_msg === 'get_brand_wcpay_request:ok') {
        resolve(res);
      } else {
        reject(new Error(res.err_msg));
      }
    });
  });
}
```

### 5.4 支付方式自动选择

```typescript
function getPaymentMethod(): PaymentMethod {
  if (isWechatBrowser()) {
    return 'WECHAT_JSAPI';
  }
  return 'WECHAT_NATIVE';
}
```

### 5.5 免费票种处理

如果用户选择的票种价格为 0 或 null：
- 直接创建报名记录，状态为 `APPROVED` 或 `PENDING`（根据活动设置）
- 不创建订单，不显示支付弹窗
- 直接显示报名成功页面

---

## 6. Webhook 处理逻辑

### 6.1 支付成功回调

```typescript
async function handlePaymentSuccess(notification: WechatPayNotification) {
  const { out_trade_no, transaction_id } = notification;

  // 1. 查找订单
  const order = await db.eventOrder.findUnique({
    where: { orderNo: out_trade_no },
    include: { event: true, registration: true, user: true }
  });

  if (!order || order.status !== 'PENDING') {
    return; // 订单不存在或已处理
  }

  // 2. 开启事务处理
  await db.$transaction(async (tx) => {
    // 2.1 更新订单状态
    await tx.eventOrder.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        transactionId: transaction_id,
        paidAt: new Date(),
      }
    });

    // 2.2 更新报名状态（从 PENDING_PAYMENT 变为 APPROVED 或 PENDING）
    const newStatus = order.event.requireApproval ? 'PENDING' : 'APPROVED';
    await tx.eventRegistration.update({
      where: { id: order.registrationId },
      data: { status: newStatus }
    });
  });

  // 3. 发送邮件通知
  await sendPaymentSuccessEmail(order);
}
```

### 6.2 退款回调

```typescript
async function handleRefundSuccess(notification: WechatRefundNotification) {
  const { out_trade_no, refund_id } = notification;

  const order = await db.eventOrder.findUnique({
    where: { orderNo: out_trade_no },
    include: { registration: true, ticketType: true }
  });

  if (!order) return;

  await db.$transaction(async (tx) => {
    // 1. 更新订单状态
    await tx.eventOrder.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        refundId: refund_id,
        refundedAt: new Date(),
      }
    });

    // 2. 取消报名记录
    await tx.eventRegistration.update({
      where: { id: order.registrationId },
      data: { status: 'CANCELLED' }
    });

    // 3. 释放库存
    await tx.eventTicketType.update({
      where: { id: order.ticketTypeId },
      data: {
        currentQuantity: { decrement: order.quantity }
      }
    });
  });
}
```

---

## 7. 订单超时处理

### 7.1 方案选择

使用 **定时任务 + 数据库查询** 方案：

```typescript
// 每分钟执行一次
async function cancelExpiredOrders() {
  const expiredOrders = await db.eventOrder.findMany({
    where: {
      status: 'PENDING',
      expiredAt: { lt: new Date() }
    },
    include: { ticketType: true, registration: true }
  });

  for (const order of expiredOrders) {
    await db.$transaction(async (tx) => {
      // 1. 更新订单状态
      await tx.eventOrder.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });

      // 2. 删除报名记录（用户需重新填写）
      if (order.registrationId) {
        await tx.eventRegistration.delete({
          where: { id: order.registrationId }
        });
      }

      // 3. 释放库存
      await tx.eventTicketType.update({
        where: { id: order.ticketTypeId },
        data: {
          currentQuantity: { decrement: order.quantity }
        }
      });
    });
  }
}
```

### 7.2 定时任务配置

可以使用以下方式之一：
1. **Vercel Cron Jobs** - 如果部署在 Vercel
2. **外部 Cron 服务** - 如 cron-job.org 调用 API
3. **数据库触发器** - PostgreSQL 定时任务

推荐使用 Vercel Cron Jobs：

`vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/cancel-expired-orders",
    "schedule": "* * * * *"
  }]
}
```

---

## 8. 库存锁定机制

### 8.1 报名提交时锁定（先报名后支付流程）

```typescript
async function registerWithPayment(params: RegisterParams) {
  return await db.$transaction(async (tx) => {
    // 1. 检查库存
    const ticketType = await tx.eventTicketType.findUnique({
      where: { id: params.ticketTypeId }
    });

    if (!ticketType.isActive) {
      throw new Error('票种已下架');
    }

    const availableQuantity = ticketType.maxQuantity
      ? ticketType.maxQuantity - ticketType.currentQuantity
      : Infinity;

    if (availableQuantity < params.quantity) {
      throw new Error('库存不足');
    }

    // 2. 锁定库存（增加已售数量）
    await tx.eventTicketType.update({
      where: { id: params.ticketTypeId },
      data: {
        currentQuantity: { increment: params.quantity }
      }
    });

    // 3. 创建报名记录（状态为 PENDING_PAYMENT）
    const registration = await tx.eventRegistration.create({
      data: {
        eventId: params.eventId,
        userId: params.userId,
        ticketTypeId: params.ticketTypeId,
        status: 'PENDING_PAYMENT',
        // ... 其他报名信息
      }
    });

    // 4. 创建订单
    const order = await tx.eventOrder.create({
      data: {
        orderNo: generateOrderNo(),
        eventId: params.eventId,
        userId: params.userId,
        ticketTypeId: params.ticketTypeId,
        registrationId: registration.id,
        quantity: params.quantity,
        unitPrice: ticketType.price,
        totalAmount: ticketType.price * params.quantity * 100, // 转为分
        expiredAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
      }
    });

    return { registration, order };
  });
}
```

### 8.2 超时释放

见第 7 节的超时处理逻辑 - 删除报名记录并释放库存。

### 8.3 用户取消支付

```typescript
async function cancelPayment(orderId: string, userId: string) {
  const order = await db.eventOrder.findUnique({
    where: { id: orderId },
    include: { registration: true }
  });

  if (!order || order.userId !== userId) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'PENDING') {
    throw new Error('订单状态不允许取消');
  }

  await db.$transaction(async (tx) => {
    // 1. 更新订单状态
    await tx.eventOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    // 2. 删除报名记录
    await tx.eventRegistration.delete({
      where: { id: order.registrationId }
    });

    // 3. 释放库存
    await tx.eventTicketType.update({
      where: { id: order.ticketTypeId },
      data: {
        currentQuantity: { decrement: order.quantity }
      }
    });
  });
}
```

---

## 9. 退款流程

### 9.1 管理员发起退款

```typescript
async function refundOrder(orderId: string, params: RefundParams) {
  const order = await db.eventOrder.findUnique({
    where: { id: orderId },
    include: { registration: true }
  });

  if (order.status !== 'PAID') {
    throw new Error('订单状态不允许退款');
  }

  // 1. 调用微信退款 API
  const refundResult = await wechatPay.refund({
    out_trade_no: order.orderNo,
    out_refund_no: generateRefundNo(),
    reason: params.reason,
    amount: {
      refund: params.amount || order.totalAmount,
      total: order.totalAmount,
      currency: 'CNY'
    }
  });

  // 2. 更新订单状态
  await db.$transaction(async (tx) => {
    await tx.eventOrder.update({
      where: { id: orderId },
      data: {
        status: 'REFUND_PENDING',
        refundAmount: params.amount || order.totalAmount,
        refundReason: params.reason,
        refundedBy: params.operatorId,
      }
    });

    // 3. 取消报名记录
    if (order.registrationId) {
      await tx.eventRegistration.update({
        where: { id: order.registrationId },
        data: { status: 'CANCELLED' }
      });
    }

    // 4. 释放库存
    await tx.eventTicketType.update({
      where: { id: order.ticketTypeId },
      data: {
        currentQuantity: { decrement: order.quantity }
      }
    });
  });
}
```

---

## 10. 文件组织结构

```
src/
├── lib/
│   └── payments/
│       ├── index.ts                    # 支付入口（已有）
│       ├── types.ts                    # 类型定义（已有，需扩展）
│       └── provider/
│           └── wechatpay/
│               ├── index.ts            # WeChat Pay 实现
│               ├── client.ts           # 微信支付客户端初始化
│               ├── native.ts           # Native 支付
│               ├── jsapi.ts            # JSAPI 支付
│               ├── refund.ts           # 退款
│               └── webhook.ts          # Webhook 处理
├── server/
│   └── routes/
│       └── events/
│           └── orders.ts               # 订单 API 路由
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── cancel-expired-orders/
│   │   │       └── route.ts            # 超时订单处理
│   │   └── webhooks/
│   │       └── wechatpay/
│   │           └── route.ts            # 微信支付回调（已有）
│   └── (public)/
│       └── [locale]/
│           └── events/
│               └── [eventId]/
│                   └── register/
│                       └── components/
│                           ├── PaymentModal.tsx      # 支付弹窗
│                           └── WechatPayQRCode.tsx   # 二维码组件
└── features/
    └── event-orders/
        ├── hooks/
        │   ├── useCreateOrder.ts       # 创建订单 hook
        │   ├── useOrderStatus.ts       # 订单状态轮询 hook
        │   └── useWechatJSAPI.ts       # JSAPI 支付 hook
        └── components/
            └── OrderStatusBadge.tsx    # 订单状态徽章
```

---

## 11. 实现步骤

### Phase 1: 基础设施
1. 更新数据库 Schema，添加 EventOrder 模型
2. 运行数据库迁移
3. 实现微信支付客户端初始化

### Phase 2: 核心支付功能
4. 实现 Native 支付（创建订单、生成二维码）
5. 实现 JSAPI 支付
6. 实现 Webhook 处理

### Phase 3: 订单管理
7. 实现订单超时处理
8. 实现管理员退款功能
9. 实现订单查询 API

### Phase 4: 前端集成
10. 实现支付弹窗组件
11. 实现订单状态轮询
12. 集成到活动报名流程

### Phase 5: 测试与优化
13. 微信支付沙箱测试
14. 生产环境测试
15. 监控和日志完善

---

## 12. 安全考虑

1. **Webhook 签名验证** - 必须验证微信支付回调的签名
2. **幂等性处理** - 同一笔支付回调可能多次，需要幂等处理
3. **金额校验** - 回调时校验金额与订单金额一致
4. **敏感信息加密** - 商户密钥等敏感信息使用环境变量
5. **并发控制** - 使用数据库事务防止超卖

---

## 13. 待确认问题

1. **微信公众号配置** - JSAPI 支付需要在公众号后台配置支付授权目录，请在实现前完成配置：
   - 登录微信公众平台 → 设置与开发 → 公众号设置 → 功能设置 → JS接口安全域名
   - 登录微信商户平台 → 产品中心 → 开发配置 → 支付授权目录
   - 授权目录格式：`https://your-domain.com/`（需要精确到路径）

2. **证书私钥格式** - 商户证书私钥需要转换为单行格式存储在环境变量中：
   ```bash
   # 将 PEM 文件转换为单行（替换换行符为 \n）
   cat apiclient_key.pem | awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}'
   ```

3. **回调域名** - 微信支付回调 URL 需要是 HTTPS 且可公网访问，请确认域名已配置好 SSL 证书
