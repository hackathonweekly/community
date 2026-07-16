# Change: Migrate community assets to Cloudflare R2

## Why
The community site currently stores public assets in Tencent COS. Download traffic from the public bucket is expensive, and large, uncompressed user videos dominate stored bytes and transfer volume.

A live production audit on 2026-07-16 found 1,789 objects using 16.818 GiB in `hackweek-public-1303088253`. MP4/MOV files alone account for 228 objects and about 89.8% of all bytes. A production database-reference audit identified 156 abandoned submission objects using 4.545 GiB; these do not need to move. The migration must stop serving and writing active objects through Tencent COS without losing referenced content or leaving old absolute COS URLs in production data.

## What Changes
- Create a new Cloudflare R2 Standard bucket named `hackathonweekly-assets-prod` in the APAC location and expose it through `assets.hackathonweekly.com`.
- Keep browser uploads direct-to-storage through R2 presigned S3 URLs while serving public reads only through the custom asset domain.
- Replace hard-coded COS bucket names, endpoints, Tencent-specific S3 middleware, image host allowlists, and template URLs with environment-driven R2 configuration.
- Copy all non-abandoned objects to R2 with the same object keys, verify the copy, rewrite stored COS URLs to the owned asset domain, and retire the Tencent COS bucket after a rollback window.
- Keep low-traffic videos as ordinary R2 objects. With abandoned submissions excluded, the verified R2 footprint is 12.273 GiB. At current Standard pricing, the portion above the 10 GB monthly free allowance is estimated below USD 0.05/month before request charges; managed video storage or transcoding would cost more and add failure modes without reducing the bill.
- Keep the current 200 MB video limit, enable byte-range/cache verification for event-day playback, and defer transcoding until measured storage or playback thresholds justify it.
- Generate an explicit exclusion manifest for abandoned submission objects. They remain only in Tencent COS during the rollback window and are deleted with the old bucket after cutover verification.

## Impact
- Affected specs: `object-storage`
- Affected code: storage configuration, S3 client, upload API and clients, event/template asset URLs, Next.js image configuration, deployment environment, migration scripts, and Cloudflare infrastructure.
- External systems: Cloudflare R2, Cloudflare DNS/Cache, Tencent COS, and the production PostgreSQL database.
- Operational impact: one final source-egress pass from Tencent COS, a short upload freeze for final delta sync, a seven-day rollback window, and explicit COS credential revocation after cutover verification.
