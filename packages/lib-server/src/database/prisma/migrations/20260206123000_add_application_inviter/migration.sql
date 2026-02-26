-- Add inviter reference for organization applications.
ALTER TABLE "organization_application"
ADD COLUMN "inviterId" TEXT;

ALTER TABLE "organization_application"
ADD CONSTRAINT "organization_application_inviterId_fkey"
FOREIGN KEY ("inviterId") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "organization_application_inviterId_idx"
ON "organization_application"("inviterId");
