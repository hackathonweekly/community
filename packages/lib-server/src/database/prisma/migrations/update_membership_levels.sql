-- Update existing users' membership levels based on their CP values
UPDATE "user"
SET "membershipLevel" = CASE
  WHEN "cpValue" >= 5000 THEN 'LEGEND'::"MembershipLevel"
  WHEN "cpValue" >= 1500 THEN 'SENIOR'::"MembershipLevel"
  WHEN "cpValue" >= 500 THEN 'CORE'::"MembershipLevel"
  WHEN "cpValue" >= 200 THEN 'ACTIVE'::"MembershipLevel"
  WHEN "cpValue" >= 50 THEN 'MEMBER'::"MembershipLevel"
  WHEN "cpValue" >= 1 THEN 'NEWCOMER'::"MembershipLevel"
  ELSE 'VISITOR'::"MembershipLevel"
END;
