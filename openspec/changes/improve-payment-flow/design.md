# 支付流程优化 - 详细设计

## 1. 管理后台支持 PENDING_PAYMENT 状态

### 1.1 状态颜色映射

```typescript
// src/modules/dashboard/events/components/EventRegistrationsTab.tsx

const registrationStatusColors: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING_PAYMENT: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    icon: CreditCardIcon, // 或 BanknotesIcon
  },
  APPROVED: { ... },
  PENDING: { ... },
  // ...
};
```

### 1.2 状态筛选器

```tsx
<SelectContent>
  <SelectItem value="all">全部</SelectItem>
  <SelectItem value="PENDING_PAYMENT">待支付</SelectItem>
  <SelectItem value="PENDING">待审核</SelectItem>
  <SelectItem value="APPROVED">已通过</SelectItem>
  // ...
</SelectContent>
```

### 1.3 显示订单信息

在报名详情中显示关联订单：
- 订单号
- 支付金额
- 订单状态
- 过期时间（如果是待支付）

---

## 2. 待支付订单恢复机制

### 2.1 新增查询待支付订单接口

```typescript
// GET /api/events/:eventId/orders/pending
// 返回用户未过期的待支付订单

app.get("/:eventId/orders/pending", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ success: false, error: "Authentication required" }, 401);

  const eventId = c.req.param("eventId");
  const now = new Date();

  const pendingOrder = await db.eventOrder.findFirst({
    where: {
      eventId,
      userId: session.user.id,
      status: "PENDING",
      expiredAt: { gt: now },
    },
    select: {
      id: true,
      orderNo: true,
      totalAmount: true,
      expiredAt: true,
      codeUrl: true,
      createdAt: true,
    },
  });

  return c.json({ success: true, data: pendingOrder });
});
```

### 2.2 修改创建订单逻辑

```typescript
// POST /api/events/:eventId/orders

// 在创建新订单前，检查是否有未过期的待支付订单
const existingPendingOrder = await tx.eventOrder.findFirst({
  where: {
    eventId,
    userId: user.id,
    status: "PENDING",
    expiredAt: { gt: new Date() },
  },
});

if (existingPendingOrder) {
  // 返回已有订单，让用户继续支付
  return c.json({
    success: true,
    data: {
      orderId: existingPendingOrder.id,
      orderNo: existingPendingOrder.orderNo,
      totalAmount: existingPendingOrder.totalAmount,
      expiredAt: existingPendingOrder.expiredAt.toISOString(),
      codeUrl: existingPendingOrder.codeUrl,
      isExisting: true, // 标记这是已有订单
    },
  });
}

// 检查已过期的待支付订单，自动取消
const expiredOrder = await tx.eventOrder.findFirst({
  where: {
    eventId,
    userId: user.id,
    status: "PENDING",
    expiredAt: { lte: new Date() },
  },
});

if (expiredOrder) {
  await cancelEventOrder(expiredOrder.id, "EXPIRED");
}

// 继续创建新订单...
```

### 2.3 前端处理

```typescript
// EventRegistrationModal.tsx

const performPaidOrder = async () => {
  // ... 创建订单请求

  const result = await response.json();

  if (result.data.isExisting) {
    // 显示提示：检测到未完成的订单，是否继续支付？
    toast.info("检测到未完成的订单，正在恢复...");
  }

  setPaymentOrder(result.data);
  setPaymentOpen(true);
};
```

---

## 3. 支付弹窗交互优化

### 3.1 支付状态指示器

```typescript
// PaymentModal.tsx

type PaymentPhase = "waiting" | "polling" | "success" | "failed" | "expired";

const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("waiting");

// 根据轮询结果更新 phase
useEffect(() => {
  if (status === "PAID") {
    setPaymentPhase("success");
  } else if (status === "CANCELLED") {
    setPaymentPhase("failed");
  } else if (remainingSeconds <= 0) {
    setPaymentPhase("expired");
  }
}, [status, remainingSeconds]);
```

### 3.2 UI 状态展示

```tsx
{/* 状态指示器 */}
<div className="flex items-center justify-center gap-2 py-2">
  {paymentPhase === "waiting" && (
    <>
      <QrCodeIcon className="w-5 h-5 text-blue-500" />
      <span className="text-sm text-muted-foreground">请使用微信扫码支付</span>
    </>
  )}
  {paymentPhase === "polling" && (
    <>
      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      <span className="text-sm text-blue-600">正在检测支付结果...</span>
    </>
  )}
  {paymentPhase === "success" && (
    <>
      <CheckCircleIcon className="w-5 h-5 text-green-500" />
      <span className="text-sm text-green-600 font-medium">支付成功！</span>
    </>
  )}
</div>
```

### 3.3 "我已支付"按钮

```tsx
{status === "PENDING" && (
  <Button
    variant="outline"
    onClick={handleManualQuery}
    disabled={isQuerying}
  >
    {isQuerying ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        查询中...
      </>
    ) : (
      "我已支付，查询结果"
    )}
  </Button>
)}
```

### 3.4 倒计时警告

```tsx
<div className={cn(
  "flex items-center justify-between text-sm",
  remainingSeconds < 300 && "text-red-600" // 少于5分钟变红
)}>
  <span>{t("remainingTime")}</span>
  <span className="font-medium">{formatCountdown()}</span>
</div>

{remainingSeconds < 300 && remainingSeconds > 0 && (
  <div className="text-xs text-red-500">
    订单即将过期，请尽快完成支付
  </div>
)}
```

---

## 4. 主动查询微信支付状态

### 4.1 微信支付查询函数

```typescript
// packages/lib-server/src/payments/provider/wechatpay/index.ts

export const queryWechatOrderStatus = async (outTradeNo: string) => {
  const { mchId } = resolveConfig();

  const response = await wechatRequest<{
    trade_state: string;
    trade_state_desc: string;
    transaction_id?: string;
    success_time?: string;
    amount?: { total: number };
  }>({
    method: "GET",
    path: `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${mchId}`,
  });

  return {
    tradeState: response.trade_state,
    tradeStateDesc: response.trade_state_desc,
    transactionId: response.transaction_id,
    successTime: response.success_time,
    amount: response.amount?.total,
  };
};
```

### 4.2 查询订单状态接口

```typescript
// POST /api/events/:eventId/orders/:orderId/query

app.post("/:eventId/orders/:orderId/query", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ success: false, error: "Authentication required" }, 401);

  const { eventId, orderId } = c.req.param();

  const order = await db.eventOrder.findFirst({
    where: { id: orderId, eventId, userId: session.user.id },
  });

  if (!order) {
    return c.json({ success: false, error: "订单不存在" }, 404);
  }

  if (order.status !== "PENDING") {
    return c.json({
      success: true,
      data: { status: order.status, alreadyProcessed: true },
    });
  }

  // 主动查询微信支付状态
  const wechatStatus = await queryWechatOrderStatus(order.orderNo);

  if (wechatStatus.tradeState === "SUCCESS") {
    // 更新订单状态
    const updated = await markEventOrderPaid({
      orderNo: order.orderNo,
      transactionId: wechatStatus.transactionId!,
      paidAt: new Date(wechatStatus.successTime || Date.now()),
    });

    return c.json({
      success: true,
      data: {
        status: "PAID",
        registration: updated?.registrationStatus,
      },
    });
  }

  return c.json({
    success: true,
    data: {
      status: order.status,
      wechatStatus: wechatStatus.tradeState,
      wechatStatusDesc: wechatStatus.tradeStateDesc,
    },
  });
});
```

### 4.3 前端调用

```typescript
// PaymentModal.tsx

const handleManualQuery = async () => {
  setIsQuerying(true);
  try {
    const response = await fetch(
      `/api/events/${eventId}/orders/${order.orderId}/query`,
      { method: "POST" }
    );
    const result = await response.json();

    if (result.data?.status === "PAID") {
      setStatus("PAID");
      toast.success("支付成功！");
      // 触发成功回调
      if (result.data.registration) {
        onPaymentSuccess(result.data.registration);
      }
    } else if (result.data?.wechatStatus === "NOTPAY") {
      toast.info("暂未检测到支付，请确认是否已完成支付");
    } else if (result.data?.wechatStatus === "CLOSED") {
      toast.error("订单已关闭");
      setStatus("CANCELLED");
    }
  } catch (error) {
    toast.error("查询失败，请稍后重试");
  } finally {
    setIsQuerying(false);
  }
};
```

---

## 5. 国际化文案

```json
// zh.json
{
  "events.registration.payment": {
    "title": "订单支付",
    "orderNumber": "订单号",
    "amount": "支付金额",
    "scanToPay": "请使用微信扫码支付",
    "polling": "正在检测支付结果...",
    "paidSuccess": "支付成功！",
    "orderCancelled": "订单已取消",
    "orderExpired": "订单已过期",
    "remainingTime": "剩余支付时间",
    "expiringWarning": "订单即将过期，请尽快完成支付",
    "cancelOrder": "取消订单",
    "close": "关闭",
    "queryPayment": "我已支付，查询结果",
    "querying": "查询中...",
    "existingOrderFound": "检测到未完成的订单，正在恢复...",
    "paymentNotDetected": "暂未检测到支付，请确认是否已完成支付",
    "orderClosed": "订单已关闭"
  }
}
```

---

## 6. 错误处理

### 6.1 网络错误重试

```typescript
// 轮询失败时的重试逻辑已存在，保持不变
// 但增加更友好的提示

{pollingError && status === "PENDING" && (
  <div className="flex items-center gap-2 text-xs text-amber-600">
    <ExclamationTriangleIcon className="w-4 h-4" />
    <span>{pollingError}</span>
    <Button variant="link" size="sm" onClick={fetchOrderStatus}>
      重试
    </Button>
  </div>
)}
```

### 6.2 订单状态不一致处理

如果前端显示待支付但后端已支付（webhook 已处理）：
- 轮询会自动检测到 PAID 状态
- 手动查询也会返回正确状态
- 两种方式都会触发成功回调

---

## 7. 测试用例

1. **正常支付流程**
   - 创建订单 → 显示二维码 → 扫码支付 → 轮询检测成功 → 显示成功

2. **关闭弹窗后恢复**
   - 创建订单 → 关闭弹窗 → 重新点击报名 → 恢复已有订单 → 继续支付

3. **订单过期**
   - 创建订单 → 等待过期 → 重新点击报名 → 自动取消旧订单 → 创建新订单

4. **手动查询**
   - 扫码支付 → 点击"我已支付" → 查询成功 → 显示成功

5. **管理后台**
   - 用户下单未支付 → 管理员看到 PENDING_PAYMENT 状态 → 筛选待支付订单
