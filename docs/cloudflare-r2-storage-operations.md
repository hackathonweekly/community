# Cloudflare R2 storage operations

## Production resources

- R2 bucket: `hackathonweekly-assets-prod`
- Storage class and placement: Standard, APAC location hint
- Public origin: `https://assets.hackathonweekly.com`
- Private S3 API origin: `https://4103ce09aa914f8f387eb86b66d23376.r2.cloudflarestorage.com`
- Cloudflare account: `4103ce09aa914f8f387eb86b66d23376`
- Cloudflare zone: `hackathonweekly.com` (`c1d2f45fb48e3d4be9920389d59094aa`)
- `r2.dev`: disabled
- TLS minimum: 1.2
- Multipart upload cleanup: abort incomplete uploads after 7 days

The bucket custom domain is the only public read origin. Presigned uploads use
the private S3 API origin. Public URLs must never be derived from a presigned
URL.

## CORS and upload policy

Allowed origins:

- `https://hackathonweekly.com`
- `https://www.hackathonweekly.com`
- `http://localhost:3000`

Allowed methods are `GET`, `HEAD`, and `PUT`. The application accepts the
configured public logical bucket only, validates paths and MIME types, and caps
declared and direct-upload sizes at 200 MB by default.

## Deployment configuration

Production runs in Zeabur project `hack-community`, service `community`,
environment `production`. These variables are required and are stored only in
Zeabur:

- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`
- `S3_REGION=auto`
- `S3_BUCKET_PUBLIC=hackathonweekly-assets-prod`
- `NEXT_PUBLIC_S3_ENDPOINT=https://assets.hackathonweekly.com`

The R2 token is scoped to the production bucket for object read/write. Local
copies of the derived S3 credentials are stored in macOS Keychain under these
service names and must not be copied into the repository:

- `hackathonweekly-r2-access-key-id`
- `hackathonweekly-r2-secret-access-key`

## Verified migration inventory

The production audit and final verification on 2026-07-16 produced:

- Tencent source: 1,789 objects / 16.818 GiB
- R2 inclusion set: 1,633 objects / 12.273 GiB
- Production database/template references: 761 keys, all present in R2
- Approved abandoned submission exclusion: 156 objects / 4.545 GiB
- Old COS URL columns remaining after the transaction: 0

The evidence manifests are generated under the ignored local directory
`temp/storage-migration/`. The final inclusion manifest is derived from the
Zeabur production database, not a developer database.

Videos remain ordinary R2 objects. MP4 and MOV range reads, CORS, signed PUT,
public GET, and delete were verified against the live bucket. No Cloudflare
Stream or transcoding pipeline is used because playback is rare and current R2
storage above the monthly free allowance costs less than an estimated USD 0.05
per month before request charges.

## Rollback and Tencent retirement

The rollback window ends no earlier than 2026-07-23, after seven clean days.
Until then:

- Keep `hackweek-public-1303088253` readable.
- Do not restore application writes to COS unless rolling back.
- Keep the pre-change manifests and database URL rewrite report.
- Monitor asset 404s, upload failures, video range failures, and occurrences of
  `hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com`.

After the clean observation window:

1. Run the migration and URL-rewrite scripts in dry-run mode against the Zeabur
   production `DATABASE_URL` and confirm zero new COS references.
2. Export a final COS manifest.
3. Revoke the COS object-storage credentials. Do not remove Tencent SMS or
   content-moderation credentials.
4. Disable COS public access and delete the bucket, including the 156-object
   abandoned exclusion set.

Rollback before retirement by restoring the prior COS S3 variables in Zeabur,
redeploying the last compatible commit, and reversing only the hostname
replacement using the retained report. Leave R2 intact for diagnosis.

## Cost guardrail

Set the operational warning threshold at 15 GB of R2 Standard storage. Review
the retained set when the threshold is crossed. Reconsider asynchronous video
transcoding only if retained storage reaches 50 GB, individual videos regularly
hit the 200 MB limit, or measured competition-day playback is poor.
