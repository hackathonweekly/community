## 1. Cloudflare infrastructure

- [x] 1.1 Create `hackathonweekly-assets-prod` as an APAC R2 Standard bucket.
- [x] 1.2 Attach `assets.hackathonweekly.com`, require TLS 1.2+, keep `r2.dev` disabled, and verify DNS/TLS activation.
- [x] 1.3 Configure production CORS and method restrictions, and verify cache behavior through object response headers.
- [ ] 1.4 Create bucket-scoped R2 credentials and store them only in deployment secrets.

## 2. Storage implementation

- [ ] 2.1 Make bucket name, S3 API endpoint, public endpoint, and region fully environment-driven.
- [ ] 2.2 Remove the Tencent COS `Appid` middleware and all COS host/bucket runtime fallbacks.
- [x] 2.3 Ensure public URLs always use the configured custom domain rather than the signed upload origin.
- [x] 2.4 Enforce the existing file-size/type limits before the application-buffered direct-upload fallback reads a payload.
- [x] 2.5 Add tests for R2 presigning, public URL generation, size/type enforcement, and deletion.

## 3. Selective data migration

- [x] 3.1 Export the full COS manifest and the current database/repository reference set.
- [x] 3.2 Persist the 297-object abandoned-submission exclusion manifest.
- [x] 3.3 Run a small-prefix Tencent COS to R2 compatibility copy.
- [x] 3.4 Copy the 1,492-object inclusion set with existing keys and metadata.
- [x] 3.5 Verify counts, byte totals, all 522 known references, representative reads, and MP4/MOV byte ranges.

## 4. Cutover

- [ ] 4.1 Deploy R2-capable code and configuration with both old and new image hosts allowed during rollback.
- [ ] 4.2 Freeze uploads, regenerate manifests, copy the final delta, switch writes/public URLs to R2, and unfreeze uploads.
- [ ] 4.3 Backfill COS URLs across text, rich-text, JSON, and array columns with pre/post assertions and a rollback report.
- [ ] 4.4 Replace committed template URLs and verify production pages, uploads, and media playback.
- [ ] 4.5 Run Mainland China and overseas availability/latency probes before declaring cutover complete.

## 5. Tencent retirement and verification

- [ ] 5.1 Observe seven days of R2 errors, media failures, old-host references, and upload success rate.
- [ ] 5.2 Revoke application COS storage credentials and remove them from all environments.
- [ ] 5.3 Export a final COS manifest, disable public access, and delete `hackweek-public-1303088253`, including excluded abandoned submissions.
- [ ] 5.4 Run `pnpm lint`, `pnpm type-check`, targeted unit tests, upload E2E tests, and production asset/video smoke tests.
- [ ] 5.5 Document Cloudflare resources, secret ownership, rollback expiry, and R2 usage alerts at 8 GB.
