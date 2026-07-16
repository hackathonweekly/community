## Context

The application already uses the AWS SDK against an S3-compatible endpoint, but the implementation is coupled to Tencent COS:

- `packages/config/src/index.ts` hard-codes `hackweek-public-1303088253` and the COS public host.
- `packages/lib-server/src/storage/index.ts` injects Tencent's `Appid` header.
- Production data stores absolute COS URLs in ordinary text, rich text, JSON, and array columns. Absolute URLs are returned unchanged, so changing only environment variables would leave historical traffic on Tencent.
- The browser limits attachments to 200 MB, but the direct-upload fallback can buffer the full payload in application memory.

### Live inventory (2026-07-16)

| Surface | Evidence |
|---|---:|
| Tencent COS bucket | 1,789 objects / 16.818 GiB |
| MP4 + MOV | 228 objects / 15.10 GiB / 89.8% of bytes |
| Distinct keys referenced by the production database or committed templates | 761 objects / 11.761 GiB |
| Unreferenced submission objects approved for removal | 156 objects / 4.545 GiB |
| Unreferenced submission videos in that removal set | 72 objects / 4.011 GiB |
| Conservative migration set | 1,633 objects / 12.273 GiB |
| Referenced keys missing from COS | 0 |

The migration set excludes only objects under `events/<eventId>/submissions/` that are not referenced by the current production database. Every other object is copied, including small unreferenced templates, event content, QR codes, and historical public assets, to bias toward site stability.

Cloudflare account checks confirmed that `hackathonweekly.com` is an active zone in the same account, `assets.hackathonweekly.com` is unused, and R2 access is available. An old `hackweek` R2 bucket contains one small object and is attached to the unrelated, currently broken `r2.hackweek.cn` custom domain; it will not be reused.

## Goals / Non-Goals

- Goals:
  - Stop new writes and public reads through Tencent COS.
  - Preserve every referenced object and conservatively retain non-submission assets.
  - Make `assets.hackathonweekly.com` the stable, provider-independent public asset origin.
  - Keep the retained R2 set within the Standard free tier where possible.
  - Preserve current video playback behavior and prioritize event-day stability.
  - Produce a reversible and auditable cutover.
- Non-Goals:
  - Removing Tencent Cloud SMS or content-moderation integrations; this change retires object storage only.
  - Migrating abandoned submission files that have no production database reference.
  - Adding Cloudflare Stream or an FFmpeg transcoding service without evidence that its recurring/storage/compute cost is justified.
  - Changing the attachment data model or playback UI.

## Decisions

### Decision: Create a dedicated R2 Standard bucket

Create `hackathonweekly-assets-prod` with an APAC location hint and Standard storage class.

- The 12.273 GiB conservative migration set exceeds the 10 GB monthly free allowance only slightly; at current Standard pricing the estimated excess storage charge is below USD 0.05/month before request charges.
- R2 direct egress is free, so rare event-day playback does not create bandwidth charges.
- Infrequent Access is rejected because the free tier does not apply and reads add retrieval charges.
- The legacy `hackweek` bucket remains untouched.

### Decision: Store video directly in R2 without transcoding

Video traffic is concentrated around competition day and is otherwise close to zero. At the measured retained footprint:

- R2 storage remains effectively negligible in cost, with an estimated excess storage charge below USD 0.05/month before request charges.
- Cloudflare Stream adds a minimum storage purchase based on video minutes even when videos are not watched.
- Browser-side FFmpeg is unreliable for 100-200 MB mobile uploads, and server-side FFmpeg adds queues, CPU pressure, temporary storage, and another failure path on the busiest day.

Therefore new and historical active videos remain ordinary R2 objects with the current 200 MB upload limit. The custom domain cache and byte-range behavior are verified against representative MP4/MOV files. Before a competition, an operations command may warm the current event's referenced videos.

Reconsider asynchronous transcoding only when retained R2 usage reaches 50 GB, individual videos regularly exceed 200 MB, or playback metrics show an event-day experience problem.

### Decision: Separate upload and read origins

- S3 API endpoint for presigned uploads: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
- Public read origin: `https://assets.hackathonweekly.com`.
- Presigned URLs cannot use the custom domain, so public URLs must never be derived from the signed URL origin.
- Bucket name, API endpoint, public endpoint, and region are deployment configuration. No COS host or bucket remains as a runtime fallback.

### Decision: Restrictive CORS and cache policy

- Allow browser upload/read methods only from `https://hackathonweekly.com` and configured preview/local development origins.
- Do not enable the public `r2.dev` hostname.
- Bind R2 directly to `assets.hackathonweekly.com`; do not create a CNAME to `r2.dev`.
- Uploads use the signed S3 API hostname; the custom domain serves `GET`/`HEAD` only.
- Enable caching for immutable keys and verify `Range`, `Content-Type`, `ETag`, and CORS behavior for images, documents, audio, MP4, and MOV.

### Decision: Selective migration with an explicit exclusion manifest

1. Export a full COS manifest containing key, size, last-modified timestamp, content type, and ETag.
2. Export every current database/repository-referenced COS key.
3. Define the exclusion set as unreferenced keys matching `events/<eventId>/submissions/`; the audited production set contains 156 objects and 4.545 GiB.
4. Copy the remaining 1,633 objects and 12.273 GiB to R2 with identical keys and metadata.
5. Verify destination count/bytes, `HEAD` all 761 known referenced objects, and run full/range reads across representative file types and sizes.
6. Freeze uploads briefly, regenerate the manifests, copy the final delta, and block cutover if any new key is unclassified.
7. Switch writes/public URLs to R2 and backfill the 15 database columns containing the old COS hostname.

The exclusion manifest remains in the migration evidence. Excluded objects stay in COS only during the rollback window; when the old bucket is deleted, those abandoned files are deleted too.

### Decision: Observable rollback before Tencent retirement

- Keep COS readable but stop application writes for seven days after cutover.
- Alert on application responses, database values, or browser requests containing the old COS hostname.
- Compare asset 404s, upload failures, and video playback errors with the pre-cutover baseline.
- After seven clean days, revoke the COS storage credentials, disable public access, export a final manifest, and delete the old bucket including the exclusion set.

## Rollout and Rollback

### Rollout gates

1. R2 bucket, custom domain, TLS, CORS, cache rules, and scoped credentials are active.
2. Source and destination manifests match the 1,633-object inclusion set by key and size.
3. All 761 known referenced keys return successfully through `assets.hackathonweekly.com`.
4. MP4/MOV byte-range playback succeeds through the custom domain.
5. Production and Mainland China probes meet the agreed success-rate threshold.
6. Database backfill leaves zero old-host references.
7. Authenticated upload smoke tests pass for image, document, audio, MP4, and MOV.

### Rollback

- Restore Tencent endpoint credentials and the previous public asset origin.
- Reverse the hostname-only database replacement from the retained pre-change report.
- Leave R2 data intact for diagnosis.
- Rollback remains available until COS credentials and public access are revoked after the seven-day observation period.

## Risks / Trade-offs

- Ordinary R2 buckets are not located in Mainland China, and R2 custom domains are not supported inside Cloudflare China Network. APAC placement is only a best-effort hint, so domestic probes are a hard cutover gate.
- Direct MP4/MOV playback transfers more bytes than adaptive streaming, but current playback frequency is too low for that to create R2 egress cost. The simpler path is more stable.
- Database reachability cannot prove that an abandoned submission URL was never shared externally. The user has explicitly accepted deletion of abandoned submissions; the manifest preserves an audit trail until COS retirement.
- Super Slurper supports generic S3-compatible sources, but Tencent COS is not listed among Cloudflare's explicitly tested providers. A test prefix must pass before bulk transfer; a local streaming copier is the fallback.

## References

- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 public buckets and custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [R2 Super Slurper](https://developers.cloudflare.com/r2/data-migration/super-slurper/)
- [Cloudflare China Network product availability](https://developers.cloudflare.com/china-network/reference/available-products/)
