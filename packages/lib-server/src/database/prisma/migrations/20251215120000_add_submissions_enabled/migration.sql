-- Add event-level plugin flag for project submissions.
-- Nullable for backwards compatibility: NULL => legacy defaults (e.g. hackathon enabled).
ALTER TABLE "event"
ADD COLUMN "submissionsEnabled" BOOLEAN;

