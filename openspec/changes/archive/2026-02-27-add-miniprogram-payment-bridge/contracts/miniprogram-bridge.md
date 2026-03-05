# Mini Program Payment Bridge Contract (H5 <-> Shell)

## Versioning
- Contract name: `HW_MINI_PAYMENT_BRIDGE`
- Contract version: `1.0.0`
- Minimum shell bridge version: `1.2.0`

## Global Bridge Object
The shell SHALL inject `window.__HWMiniAppBridge__` in Mini Program WebView.

```ts
interface HWMiniAppBridge {
  getCapabilities(): Promise<{
    bridgeVersion: string;
    supportsRequestPayment: boolean;
  }>;

  requestPayment(input: {
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: "RSA";
    paySign: string;
    orderNo: string;
  }): Promise<{
    ok: boolean;
    errCode?:
      | "PAY_CANCELLED"
      | "PAY_FAILED"
      | "BRIDGE_NOT_SUPPORTED"
      | "BRIDGE_TIMEOUT"
      | "INVALID_PAYLOAD";
    errMsg?: string;
  }>;
}
```

## Capability Handshake
- H5 SHALL call `getCapabilities()` before invoking `requestPayment`.
- If object missing, call fails, version too low, or `supportsRequestPayment=false`, H5 MUST treat it as bridge unavailable.

## Error Code Mapping (Shell -> H5)
- `BRIDGE_NOT_SUPPORTED` => H5/API error `MINI_PROGRAM_BRIDGE_REQUIRED`
- `PAY_CANCELLED` => `MINI_PROGRAM_PAY_CANCELLED`
- `PAY_FAILED` => `MINI_PROGRAM_PAY_FAILED`
- `BRIDGE_TIMEOUT` => `MINI_PROGRAM_BRIDGE_TIMEOUT`
- `INVALID_PAYLOAD` => `MINI_PROGRAM_PAY_FAILED`

## Runtime Behavior
- Shell SHALL map `requestPayment` to `wx.requestPayment` parameters 1:1.
- Shell SHALL resolve `ok=true` only when `wx.requestPayment` success callback is called.
- H5 SHALL continue polling/order query for final payment status (webhook/query remains source of truth).

## Security Requirements
- Shell SHALL not mutate signed payment fields received from server.
- H5 SHALL only accept bridge object in Mini Program context.
- Any JSON message transport fallback (if used internally by shell) SHALL enforce origin and schema checks before dispatch.
