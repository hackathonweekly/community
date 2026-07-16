## ADDED Requirements

### Requirement: Cloudflare-hosted public object storage
The system SHALL store public non-video assets in Cloudflare R2 and SHALL serve them through `https://assets.hackathonweekly.com` without using Tencent COS for new writes or public reads after cutover.

#### Scenario: Authenticated user uploads a public asset
- **WHEN** an authenticated user requests and completes an authorized non-video upload
- **THEN** the object is written to the configured R2 bucket using a server-generated key
- **AND** the returned canonical URL starts with `https://assets.hackathonweekly.com/`
- **AND** no Tencent COS request is required

#### Scenario: Historical asset is read after cutover
- **GIVEN** a historical COS object was migrated with the same key
- **WHEN** a page references that asset after cutover
- **THEN** the asset is served successfully from `assets.hackathonweekly.com`
- **AND** the page does not return or request the old COS hostname

### Requirement: Provider-independent public URLs
The system SHALL construct public asset URLs from an explicitly configured public endpoint and SHALL NOT derive public URLs from presigned upload origins or hard-coded provider endpoints.

#### Scenario: R2 presigned upload succeeds
- **WHEN** the browser uploads through the R2 S3 API hostname
- **THEN** the saved and returned asset URL uses `assets.hackathonweekly.com`
- **AND** the R2 S3 API hostname is not persisted as the public URL

### Requirement: Constrained upload destinations
The system SHALL restrict uploads to configured logical buckets, validate object paths and content types, and reject attempts to choose an arbitrary physical bucket or unsafe path.

#### Scenario: Client supplies an unauthorized bucket or unsafe path
- **WHEN** an authenticated client requests a signed upload for an unconfigured bucket or traversal path
- **THEN** the request is rejected
- **AND** no presigned URL is issued

### Requirement: Upload size and type verification
The system SHALL enforce declared size and MIME rules before issuing an upload URL and SHALL reject an oversized direct-upload fallback before buffering its body.

#### Scenario: Requested upload exceeds its allowed size
- **WHEN** a client declares a file size above the configured limit or submits an oversized direct upload
- **THEN** the upload request is rejected
- **AND** no presigned URL is issued or application buffer is allocated

### Requirement: Reversible selective storage migration
The system SHALL preserve source object keys, produce source/destination and exclusion manifests, verify all known referenced objects, and retain a rollback window before revoking Tencent COS access.

#### Scenario: Destination verification fails
- **WHEN** any known referenced key is missing or has a different byte size in R2
- **THEN** production cutover is blocked or rolled back
- **AND** Tencent COS remains available until the discrepancy is resolved

### Requirement: Abandoned submission exclusion
The system SHALL exclude an object from migration only when its key is under a submission namespace, it has no production database reference, and it is recorded in the approved exclusion manifest.

#### Scenario: Unreferenced submission object is classified
- **WHEN** an object under `events/<eventId>/submissions/` has no production database reference
- **THEN** it is recorded in the exclusion manifest
- **AND** it is not copied to R2
- **AND** it remains available only in COS until the rollback window ends

### Requirement: Low-traffic video storage
The system SHALL store active submission videos as ordinary R2 objects, preserve the existing 200 MB limit, and support byte-range playback through the custom asset domain without requiring a managed video service.

#### Scenario: User plays a migrated video
- **WHEN** the browser requests a byte range from an active MP4 or MOV attachment
- **THEN** `assets.hackathonweekly.com` returns a successful range response with the correct media type
- **AND** no Tencent COS request is required
