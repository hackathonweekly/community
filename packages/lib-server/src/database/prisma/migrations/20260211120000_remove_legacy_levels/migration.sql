-- Retire legacy creator/mentor/contributor level system.

ALTER TABLE "user" DROP COLUMN IF EXISTS "creatorLevel";
ALTER TABLE "user" DROP COLUMN IF EXISTS "mentorLevel";
ALTER TABLE "user" DROP COLUMN IF EXISTS "contributorLevel";

DROP TABLE IF EXISTS "level_application" CASCADE;
DROP TABLE IF EXISTS "LevelApplication" CASCADE;

DROP TYPE IF EXISTS "CreatorLevel";
DROP TYPE IF EXISTS "MentorLevel";
DROP TYPE IF EXISTS "ContributorLevel";
DROP TYPE IF EXISTS "LevelType";
DROP TYPE IF EXISTS "LevelApplicationAction";
DROP TYPE IF EXISTS "LevelApplicationStatus";
