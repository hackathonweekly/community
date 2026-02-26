import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.NullTypes.DbNull;
  if (v === 'JsonNull') return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','createdAt','updatedAt','username','role','banned','banReason','banExpires','onboardingComplete','paymentsCustomerId','locale','twoFactorEnabled','bio','region','phoneNumber','phoneNumberVerified','pendingInvitationId','gender','userRoleString','currentWorkOn','whatICanOffer','whatIAmLookingFor','skills','lifeStatus','lastProfileUpdate','githubUrl','twitterUrl','websiteUrl','wechatId','wechatQrCode','wechatOpenId','wechatUnionId','cpValue','joinedAt','profileViews','profilePublic','showEmail','showWechat','realName','idCard','idCardVerified','shippingAddress','shippingName','shippingPhone','identityVerifiedAt','membershipLevel']);

export const EventsApiTokenScalarFieldEnumSchema = z.enum(['id','userId','tokenHash','tokenLastFour','createdAt','createdByIp','createdByUserAgent','lastUsedAt','lastUsedIp','lastUsedUserAgent','revokedAt']);

export const SessionScalarFieldEnumSchema = z.enum(['id','expiresAt','ipAddress','userAgent','userId','impersonatedBy','activeOrganizationId','token','createdAt','updatedAt']);

export const AccountScalarFieldEnumSchema = z.enum(['id','accountId','providerId','userId','accessToken','refreshToken','idToken','expiresAt','password','accessTokenExpiresAt','refreshTokenExpiresAt','scope','createdAt','updatedAt']);

export const VerificationScalarFieldEnumSchema = z.enum(['id','identifier','value','expiresAt','createdAt','updatedAt']);

export const PasskeyScalarFieldEnumSchema = z.enum(['id','name','publicKey','userId','credentialID','counter','deviceType','backedUp','transports','createdAt']);

export const TwoFactorScalarFieldEnumSchema = z.enum(['id','secret','backupCodes','userId']);

export const OrganizationScalarFieldEnumSchema = z.enum(['id','name','slug','logo','createdAt','metadata','paymentsCustomerId','summary','description','location','tags','audienceQrCode','memberQrCode','contactInfo','coverImage','isPublic','membershipRequirements']);

export const MemberScalarFieldEnumSchema = z.enum(['id','organizationId','userId','role','createdAt','invitedBy','invitationId']);

export const OrganizationApplicationScalarFieldEnumSchema = z.enum(['id','organizationId','userId','inviterId','reason','status','submittedAt','reviewedAt','reviewedBy','reviewNote','createdAt','updatedAt']);

export const OrganizationInvitationRequestScalarFieldEnumSchema = z.enum(['id','code','organizationId','inviterId','inviteeName','invitationReason','eligibilityDetails','status','applicationId','createdAt','updatedAt']);

export const InvitationScalarFieldEnumSchema = z.enum(['id','organizationId','email','role','status','expiresAt','inviterId','targetUserId','metadata','createdAt','updatedAt']);

export const PurchaseScalarFieldEnumSchema = z.enum(['id','organizationId','userId','type','customerId','subscriptionId','productId','status','createdAt','updatedAt']);

export const AiChatScalarFieldEnumSchema = z.enum(['id','organizationId','userId','title','messages','createdAt','updatedAt']);

export const ProjectScalarFieldEnumSchema = z.enum(['id','shortId','userId','title','description','tagline','url','featured','order','stage','subtitle','screenshots','projectTags','pricingType','milestones','demoVideoUrl','isRecruiting','recruitmentStatus','recruitmentTags','teamDescription','teamSkills','teamSize','contactInfo','creationExperience','isComplete','completionScore','communityUseAuth','customFields','isSubmission','submittedAt','viewCount','likeCount','commentCount','submissionCount','awardCount','githubUrl','slidesUrl','inspiration','challenges','learnings','nextSteps','createdAt','updatedAt']);

export const ProjectMemberScalarFieldEnumSchema = z.enum(['id','projectId','userId','role','joinedAt']);

export const ProjectAttachmentScalarFieldEnumSchema = z.enum(['id','projectId','fileName','fileUrl','fileType','mimeType','fileSize','order','createdAt','updatedAt']);

export const ProjectVoteScalarFieldEnumSchema = z.enum(['id','projectId','userId','eventId','createdAt']);

export const ProjectLikeScalarFieldEnumSchema = z.enum(['id','projectId','userId','createdAt']);

export const ProjectBookmarkScalarFieldEnumSchema = z.enum(['id','projectId','userId','createdAt']);

export const CommentScalarFieldEnumSchema = z.enum(['id','content','userId','entityType','entityId','parentId','replyToId','status','isDeleted','deletedAt','deletedBy','likeCount','replyCount','createdAt','updatedAt']);

export const CommentLikeScalarFieldEnumSchema = z.enum(['id','commentId','userId','createdAt']);

export const ProjectCommentScalarFieldEnumSchema = z.enum(['id','projectId','userId','content','createdAt','updatedAt']);

export const EventScalarFieldEnumSchema = z.enum(['id','shortId','title','shortDescription','richContent','contentImages','organizerId','type','status','startTime','endTime','timezone','isOnline','address','organizationId','onlineUrl','isExternalEvent','externalUrl','maxAttendees','registrationDeadline','requireApproval','registrationSuccessInfo','registrationSuccessImage','registrationPendingInfo','registrationPendingImage','registrationFieldConfig','coverImage','tags','featured','volunteerContactInfo','volunteerWechatQrCode','organizerContact','templateId','requireProjectSubmission','projectSubmissionDeadline','askDigitalCardConsent','submissionsEnabled','hackathonConfig','registrationOpen','submissionsOpen','votingOpen','showVotesOnGallery','feedbackConfig','submissionFormConfig','viewCount','createdAt','updatedAt']);

export const EventTicketTypeScalarFieldEnumSchema = z.enum(['id','eventId','name','description','price','maxQuantity','currentQuantity','isActive','sortOrder','createdAt','updatedAt']);

export const EventTicketPriceTierScalarFieldEnumSchema = z.enum(['id','ticketTypeId','quantity','price','currency','isActive','createdAt','updatedAt']);

export const EventOrderScalarFieldEnumSchema = z.enum(['id','orderNo','eventId','userId','ticketTypeId','quantity','unitPrice','totalAmount','currency','status','paymentMethod','transactionId','paidAt','prepayId','codeUrl','refundId','refundAmount','refundedAt','refundReason','refundedBy','expiredAt','createdAt','updatedAt']);

export const EventOrderInviteScalarFieldEnumSchema = z.enum(['id','orderId','code','status','redeemedAt','redeemedBy','createdAt','updatedAt']);

export const EventPhotoScalarFieldEnumSchema = z.enum(['id','eventId','userId','imageUrl','watermarkedUrl','caption','isApproved','createdAt','updatedAt']);

export const EventAdminScalarFieldEnumSchema = z.enum(['id','eventId','userId','email','role','status','invitedBy','invitedAt','acceptedAt','canEditEvent','canManageRegistrations','canManageAdmins']);

export const EventRegistrationScalarFieldEnumSchema = z.enum(['id','eventId','userId','ticketTypeId','orderId','orderInviteId','inviteId','status','registeredAt','note','allowDigitalCardDisplay','reviewedAt','reviewedBy','reviewNote']);

export const EventQuestionScalarFieldEnumSchema = z.enum(['id','eventId','question','description','type','options','required','order']);

export const EventAnswerScalarFieldEnumSchema = z.enum(['id','questionId','userId','eventId','registrationId','answer']);

export const EventCheckInScalarFieldEnumSchema = z.enum(['id','eventId','userId','checkedInAt','checkedInBy']);

export const EventFeedbackScalarFieldEnumSchema = z.enum(['id','eventId','userId','rating','comment','suggestions','wouldRecommend','customAnswers','createdAt']);

export const EventInviteScalarFieldEnumSchema = z.enum(['id','eventId','code','type','label','issuedByUserId','createdAt','lastUsedAt']);

export const ContributionScalarFieldEnumSchema = z.enum(['id','userId','type','category','description','cpValue','sourceId','sourceType','isAutomatic','status','organizationId','reviewedBy','reviewedAt','reviewNote','evidence','createdAt','updatedAt']);

export const BadgeScalarFieldEnumSchema = z.enum(['id','name','description','iconUrl','color','rarity','isActive','isAutoAwarded','conditions','createdAt','updatedAt']);

export const UserBadgeScalarFieldEnumSchema = z.enum(['id','userId','badgeId','awardedBy','reason','awardedAt','expiresAt']);

export const AdminLogScalarFieldEnumSchema = z.enum(['id','adminId','action','targetType','targetId','details','createdAt']);

export const SystemConfigScalarFieldEnumSchema = z.enum(['id','key','value','description','updatedBy','updatedAt','createdAt']);

export const CommunityTaskScalarFieldEnumSchema = z.enum(['id','title','description','category','cpReward','status','deadline','publisherId','organizationId','isUserTask','assigneeId','claimedAt','submittedAt','submissionNote','evidenceUrls','reviewedAt','reviewNote','tags','priority','featured','createdAt','updatedAt']);

export const EmailCampaignScalarFieldEnumSchema = z.enum(['id','title','description','type','scope','organizationId','createdBy','templateId','subject','content','status','scheduledAt','sentAt','audienceConfig','recipientCount','sentCount','deliveredCount','openedCount','clickedCount','createdAt','updatedAt']);

export const EmailJobScalarFieldEnumSchema = z.enum(['id','campaignId','recipient','userId','status','scheduledAt','sentAt','deliveredAt','openedAt','clickedAt','errorMessage','retryCount','context','createdAt','updatedAt']);

export const UserEmailPreferenceScalarFieldEnumSchema = z.enum(['id','userId','subscribeNewsletter','subscribeMarketing','subscribeNotification','subscribeEvents','organizationEmails','unsubscribedAt','unsubscribeToken','createdAt','updatedAt']);

export const EventHostSubscriptionScalarFieldEnumSchema = z.enum(['id','userId','organizationId','hostUserId','createdAt','updatedAt','unsubscribedAt']);

export const UserFollowScalarFieldEnumSchema = z.enum(['id','followerId','followingId','createdAt']);

export const EventBookmarkScalarFieldEnumSchema = z.enum(['id','userId','eventId','createdAt']);

export const UserLikeScalarFieldEnumSchema = z.enum(['id','userId','likedUserId','createdAt']);

export const EventLikeScalarFieldEnumSchema = z.enum(['id','userId','eventId','createdAt']);

export const WebsiteScalarFieldEnumSchema = z.enum(['id','name','url','description','category','tags','favicon','screenshot','submittedBy','organizationId','isApproved','approvedBy','approvedAt','likeCount','viewCount','clickCount','createdAt','updatedAt']);

export const WebsiteLikeScalarFieldEnumSchema = z.enum(['id','userId','websiteId','createdAt']);

export const NotificationScalarFieldEnumSchema = z.enum(['id','userId','type','title','content','metadata','read','readAt','actionUrl','priority','relatedUserId','createdAt','updatedAt']);

export const NotificationPreferenceScalarFieldEnumSchema = z.enum(['id','userId','projectCommentEmail','projectCommentPush','projectLikeEmail','projectLikePush','organizationEmail','organizationPush','eventEmail','eventPush','eventReminderEmail','systemEmail','systemPush','socialEmail','socialPush','createdAt','updatedAt']);

export const EmailNotificationQueueScalarFieldEnumSchema = z.enum(['id','userId','notificationId','emailType','emailData','priority','status','scheduledAt','sentAt','errorMessage','retryCount','createdAt','updatedAt']);

export const VolunteerRoleScalarFieldEnumSchema = z.enum(['id','name','description','detailDescription','iconUrl','cpPoints','isActive','sortOrder','createdAt','updatedAt']);

export const EventVolunteerRoleScalarFieldEnumSchema = z.enum(['id','eventId','volunteerRoleId','recruitCount','description','requireApproval','createdAt','updatedAt']);

export const EventVolunteerRegistrationScalarFieldEnumSchema = z.enum(['id','eventId','userId','eventVolunteerRoleId','status','appliedAt','approvedAt','approvedBy','rejectedAt','rejectedBy','note','checkedIn','checkedInAt','completed','completedAt','cpAwarded']);

export const EventTemplateScalarFieldEnumSchema = z.enum(['id','name','type','description','title','defaultDescription','shortDescription','duration','maxAttendees','requireApproval','templateType','isSystemTemplate','isFeatured','isPublic','isActive','createdBy','organizationId','originalEventId','usageCount','createdAt','updatedAt']);

export const EventTemplateTicketTypeScalarFieldEnumSchema = z.enum(['id','templateId','name','description','price','maxQuantity','isDefault','sortOrder','requirements']);

export const EventTemplateVolunteerRoleScalarFieldEnumSchema = z.enum(['id','templateId','volunteerRoleId','recruitCount','description','requireApproval','cpReward']);

export const EventTemplateQuestionScalarFieldEnumSchema = z.enum(['id','templateId','question','type','options','required','targetRole','order']);

export const EventTemplateScheduleScalarFieldEnumSchema = z.enum(['id','templateId','title','description','startMinute','duration','type','order']);

export const EventProjectSubmissionScalarFieldEnumSchema = z.enum(['id','eventId','projectId','userId','submissionType','title','description','demoUrl','sourceCode','presentationUrl','status','submittedAt','reviewedAt','reviewedBy','reviewNote','judgeScore','audienceScore','finalScore','projectSnapshot','createdAt','updatedAt']);

export const AwardScalarFieldEnumSchema = z.enum(['id','name','description','category','level','iconUrl','badgeUrl','certificateTemplate','color','isActive','cpReward','sortOrder','createdBy','organizationId','createdAt','updatedAt']);

export const ProjectAwardScalarFieldEnumSchema = z.enum(['id','projectId','awardId','eventId','submissionId','awardedAt','awardedBy','reason','score','certificateUrl','certificateGenerated']);

export const EventAIRecommendationScalarFieldEnumSchema = z.enum(['id','eventId','type','userId','recommendations','metadata','createdAt','expiresAt']);

export const RecommendationFeedbackScalarFieldEnumSchema = z.enum(['id','recommendationId','userId','helpful','comment','createdAt']);

export const EventCommunicationScalarFieldEnumSchema = z.enum(['id','eventId','sentBy','type','subject','content','totalRecipients','sentCount','deliveredCount','failedCount','status','scheduledAt','sentAt','createdAt','updatedAt']);

export const EventCommunicationRecordScalarFieldEnumSchema = z.enum(['id','communicationId','eventId','recipientId','recipientEmail','recipientPhone','status','sentAt','deliveredAt','readAt','errorMessage','retryCount','externalMessageId','createdAt','updatedAt']);

export const EventParticipantInterestScalarFieldEnumSchema = z.enum(['id','eventId','interestedUserId','targetUserId','createdAt']);

export const FunctionalRoleScalarFieldEnumSchema = z.enum(['id','name','description','applicableScope','organizationId','isActive','createdAt','updatedAt']);

export const RoleAssignmentScalarFieldEnumSchema = z.enum(['id','userId','organizationId','functionalRoleId','startDate','endDate','isActive','createdAt','updatedAt']);

export const PostScalarFieldEnumSchema = z.enum(['id','userId','title','content','images','channel','linkedProjectId','linkedEventId','likeCount','commentCount','viewCount','pinned','createdAt','updatedAt']);

export const PostLikeScalarFieldEnumSchema = z.enum(['id','postId','userId','createdAt']);

export const PostBookmarkScalarFieldEnumSchema = z.enum(['id','postId','userId','createdAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema: z.ZodType<Prisma.NullableJsonNullValueInput> = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const JsonNullValueInputSchema: z.ZodType<Prisma.JsonNullValueInput> = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema: z.ZodType<Prisma.JsonNullValueFilter> = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const CommentEntityTypeSchema = z.enum(['PROJECT','EVENT','TASK','ARTICLE','ORGANIZATION','POST']);

export type CommentEntityTypeType = `${z.infer<typeof CommentEntityTypeSchema>}`

export const CommentStatusSchema = z.enum(['ACTIVE','HIDDEN','REVIEWING','REJECTED']);

export type CommentStatusType = `${z.infer<typeof CommentStatusSchema>}`

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION','ONE_TIME']);

export type PurchaseTypeType = `${z.infer<typeof PurchaseTypeSchema>}`

export const GenderSchema = z.enum(['MALE','FEMALE','OTHER','NOT_SPECIFIED']);

export type GenderType = `${z.infer<typeof GenderSchema>}`

export const ProjectStageSchema = z.enum(['IDEA_VALIDATION','DEVELOPMENT','LAUNCH','GROWTH','MONETIZATION','FUNDING','COMPLETED']);

export type ProjectStageType = `${z.infer<typeof ProjectStageSchema>}`

export const PricingTypeSchema = z.enum(['FREE','PAID','FREEMIUM']);

export type PricingTypeType = `${z.infer<typeof PricingTypeSchema>}`

export const EventTypeSchema = z.enum(['MEETUP','HACKATHON']);

export type EventTypeType = `${z.infer<typeof EventTypeSchema>}`

export const EventStatusSchema = z.enum(['DRAFT','PUBLISHED','REGISTRATION_CLOSED','ONGOING','COMPLETED','CANCELLED']);

export type EventStatusType = `${z.infer<typeof EventStatusSchema>}`

export const RegistrationStatusSchema = z.enum(['PENDING_PAYMENT','PENDING','APPROVED','WAITLISTED','REJECTED','CANCELLED']);

export type RegistrationStatusType = `${z.infer<typeof RegistrationStatusSchema>}`

export const EventOrderStatusSchema = z.enum(['PENDING','PAID','CANCELLED','REFUND_PENDING','REFUNDED']);

export type EventOrderStatusType = `${z.infer<typeof EventOrderStatusSchema>}`

export const PaymentMethodSchema = z.enum(['WECHAT_NATIVE','WECHAT_JSAPI','STRIPE','FREE']);

export type PaymentMethodType = `${z.infer<typeof PaymentMethodSchema>}`

export const EventOrderInviteStatusSchema = z.enum(['PENDING','REDEEMED','INVALID']);

export type EventOrderInviteStatusType = `${z.infer<typeof EventOrderInviteStatusSchema>}`

export const EventInviteTypeSchema = z.enum(['USER_SHARE','CHANNEL']);

export type EventInviteTypeType = `${z.infer<typeof EventInviteTypeSchema>}`

export const QuestionTypeSchema = z.enum(['TEXT','TEXTAREA','SELECT','CHECKBOX','RADIO']);

export type QuestionTypeType = `${z.infer<typeof QuestionTypeSchema>}`

export const ContributionTypeSchema = z.enum(['EVENT_CHECKIN','EVENT_FEEDBACK','EVENT_ORGANIZATION','PROJECT_CREATION','PROJECT_UPDATE','PROJECT_LIKE','COMMENT_CREATION','PROFILE_COMPLETION','CONTENT_CREATION','COMMUNITY_SERVICE','RESOURCE_INTRODUCTION','COMMUNITY_BUILDING','VOLUNTEER_SERVICE','OTHER']);

export type ContributionTypeType = `${z.infer<typeof ContributionTypeSchema>}`

export const ContributionStatusSchema = z.enum(['PENDING','APPROVED','REJECTED','REVISED']);

export type ContributionStatusType = `${z.infer<typeof ContributionStatusSchema>}`

export const BadgeRaritySchema = z.enum(['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY']);

export type BadgeRarityType = `${z.infer<typeof BadgeRaritySchema>}`

export const TaskCategorySchema = z.enum(['COMMUNITY_SERVICE','CONTENT_CREATION','PRODUCT_TECH','OPERATION_PROMOTION','OTHER']);

export type TaskCategoryType = `${z.infer<typeof TaskCategorySchema>}`

export const TaskStatusSchema = z.enum(['PUBLISHED','CLAIMED','SUBMITTED','COMPLETED','REJECTED','CANCELLED']);

export type TaskStatusType = `${z.infer<typeof TaskStatusSchema>}`

export const TaskPrioritySchema = z.enum(['LOW','NORMAL','HIGH','URGENT']);

export type TaskPriorityType = `${z.infer<typeof TaskPrioritySchema>}`

export const EmailCampaignTypeSchema = z.enum(['NEWSLETTER','NOTIFICATION','MARKETING','SYSTEM','ANNOUNCEMENT']);

export type EmailCampaignTypeType = `${z.infer<typeof EmailCampaignTypeSchema>}`

export const EmailScopeSchema = z.enum(['GLOBAL','ORGANIZATION']);

export type EmailScopeType = `${z.infer<typeof EmailScopeSchema>}`

export const CampaignStatusSchema = z.enum(['DRAFT','SCHEDULED','SENDING','COMPLETED','CANCELLED','FAILED']);

export type CampaignStatusType = `${z.infer<typeof CampaignStatusSchema>}`

export const JobStatusSchema = z.enum(['PENDING','PROCESSING','SENT','DELIVERED','OPENED','CLICKED','FAILED','CANCELLED']);

export type JobStatusType = `${z.infer<typeof JobStatusSchema>}`

export const ApplicationStatusSchema = z.enum(['PENDING','APPROVED','REJECTED','WITHDRAWN']);

export type ApplicationStatusType = `${z.infer<typeof ApplicationStatusSchema>}`

export const OrganizationInvitationRequestStatusSchema = z.enum(['PENDING','APPLICATION_SUBMITTED','APPROVED','REJECTED']);

export type OrganizationInvitationRequestStatusType = `${z.infer<typeof OrganizationInvitationRequestStatusSchema>}`

export const NotificationTypeSchema = z.enum(['PROJECT_COMMENT','PROJECT_LIKE','PROJECT_STATUS_UPDATE','PROJECT_COLLABORATION_INVITE','PROJECT_VIEW_MILESTONE','ORGANIZATION_MEMBER_APPLICATION','ORGANIZATION_APPLICATION_RESULT','ORGANIZATION_MEMBER_INVITED','ORGANIZATION_ROLE_CHANGE','ORGANIZATION_ANNOUNCEMENT','ORGANIZATION_MEMBER_REMOVED','ORGANIZATION_MEMBER_JOINED','EVENT_REGISTRATION_RESULT','EVENT_TIME_CHANGE','EVENT_CANCELLED','EVENT_REMINDER','EVENT_CHECKIN_OPEN','EVENT_NEW_REGISTRATION','EVENT_CAPACITY_WARNING','EVENT_PHOTO_UPLOADED','ACCOUNT_SECURITY','ACCOUNT_BANNED','SYSTEM_ANNOUNCEMENT','ACHIEVEMENT_UNLOCKED','DAILY_REWARD','USER_BOOKMARKED','USER_FOLLOWED','USER_LIKED','PRIVATE_MESSAGE','PROFILE_VIEW_MILESTONE','POST_COMMENT','POST_LIKE']);

export type NotificationTypeType = `${z.infer<typeof NotificationTypeSchema>}`

export const NotificationPrioritySchema = z.enum(['LOW','NORMAL','HIGH','URGENT']);

export type NotificationPriorityType = `${z.infer<typeof NotificationPrioritySchema>}`

export const EmailStatusSchema = z.enum(['PENDING','SENT','FAILED','RETRY','CANCELLED']);

export type EmailStatusType = `${z.infer<typeof EmailStatusSchema>}`

export const EventAdminRoleSchema = z.enum(['ADMIN','SUPER_ADMIN']);

export type EventAdminRoleType = `${z.infer<typeof EventAdminRoleSchema>}`

export const EventAdminStatusSchema = z.enum(['PENDING','ACCEPTED','REJECTED','REMOVED']);

export type EventAdminStatusType = `${z.infer<typeof EventAdminStatusSchema>}`

export const VolunteerStatusSchema = z.enum(['APPLIED','APPROVED','REJECTED','CANCELLED']);

export type VolunteerStatusType = `${z.infer<typeof VolunteerStatusSchema>}`

export const EventTemplateTypeSchema = z.enum(['MEETUP','HACKATHON_LEARNING','CUSTOM']);

export type EventTemplateTypeType = `${z.infer<typeof EventTemplateTypeSchema>}`

export const EventTemplateCategorySchema = z.enum(['SYSTEM','PERSONAL']);

export type EventTemplateCategoryType = `${z.infer<typeof EventTemplateCategorySchema>}`

export const ScheduleTypeSchema = z.enum(['CHECK_IN','INTRODUCTION','LEARNING','DEVELOPMENT','DEMO','NETWORKING','AWARD','BREAK']);

export type ScheduleTypeType = `${z.infer<typeof ScheduleTypeSchema>}`

export const SubmissionTypeSchema = z.enum(['HACKATHON_PROJECT','DEMO_PROJECT']);

export type SubmissionTypeType = `${z.infer<typeof SubmissionTypeSchema>}`

export const SubmissionStatusSchema = z.enum(['SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','AWARDED']);

export type SubmissionStatusType = `${z.infer<typeof SubmissionStatusSchema>}`

export const AwardCategorySchema = z.enum(['GENERAL','TECHNICAL','CREATIVE','COMMERCIAL','SOCIAL','SPECIAL']);

export type AwardCategoryType = `${z.infer<typeof AwardCategorySchema>}`

export const AwardLevelSchema = z.enum(['FIRST','SECOND','THIRD','EXCELLENCE','PARTICIPATION','SPECIAL']);

export type AwardLevelType = `${z.infer<typeof AwardLevelSchema>}`

export const RecommendationTypeSchema = z.enum(['UNIFIED','PERSONAL']);

export type RecommendationTypeType = `${z.infer<typeof RecommendationTypeSchema>}`

export const MembershipLevelSchema = z.enum(['VISITOR','NEWCOMER','MEMBER','ACTIVE','CORE','SENIOR','LEGEND']);

export type MembershipLevelType = `${z.infer<typeof MembershipLevelSchema>}`

export const CommunicationTypeSchema = z.enum(['EMAIL','SMS']);

export type CommunicationTypeType = `${z.infer<typeof CommunicationTypeSchema>}`

export const CommunicationStatusSchema = z.enum(['PENDING','SENDING','COMPLETED','FAILED','CANCELLED']);

export type CommunicationStatusType = `${z.infer<typeof CommunicationStatusSchema>}`

export const CommunicationRecordStatusSchema = z.enum(['PENDING','SENT','DELIVERED','READ','FAILED','CANCELLED']);

export type CommunicationRecordStatusType = `${z.infer<typeof CommunicationRecordStatusSchema>}`

export const PostChannelSchema = z.enum(['SHOWCASE','LEARNING','TEAM_UP','ANNOUNCEMENT','CHAT']);

export type PostChannelType = `${z.infer<typeof PostChannelSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  gender: GenderSchema.nullable(),
  membershipLevel: MembershipLevelSchema.nullable(),
  id: z.cuid(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  username: z.string().nullable(),
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.coerce.date().nullable(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullable(),
  locale: z.string().nullable(),
  twoFactorEnabled: z.boolean().nullable(),
  bio: z.string().nullable(),
  region: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  phoneNumberVerified: z.boolean().nullable(),
  pendingInvitationId: z.string().nullable(),
  userRoleString: z.string().nullable(),
  currentWorkOn: z.string().nullable(),
  whatICanOffer: z.string().nullable(),
  whatIAmLookingFor: z.string().nullable(),
  skills: z.string().array(),
  lifeStatus: z.string().nullable(),
  lastProfileUpdate: z.coerce.date().nullable(),
  githubUrl: z.string().nullable(),
  twitterUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  wechatId: z.string().nullable(),
  wechatQrCode: z.string().nullable(),
  wechatOpenId: z.string().nullable(),
  wechatUnionId: z.string().nullable(),
  cpValue: z.number().int(),
  joinedAt: z.coerce.date().nullable(),
  profileViews: z.number().int(),
  profilePublic: z.boolean(),
  showEmail: z.boolean(),
  showWechat: z.boolean(),
  realName: z.string().nullable(),
  idCard: z.string().nullable(),
  idCardVerified: z.boolean(),
  shippingAddress: z.string().nullable(),
  shippingName: z.string().nullable(),
  shippingPhone: z.string().nullable(),
  identityVerifiedAt: z.coerce.date().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// EVENTS API TOKEN SCHEMA
/////////////////////////////////////////

export const EventsApiTokenSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  tokenHash: z.string().nullable(),
  tokenLastFour: z.string().nullable(),
  createdAt: z.coerce.date(),
  createdByIp: z.string().nullable(),
  createdByUserAgent: z.string().nullable(),
  lastUsedAt: z.coerce.date().nullable(),
  lastUsedIp: z.string().nullable(),
  lastUsedUserAgent: z.string().nullable(),
  revokedAt: z.coerce.date().nullable(),
})

export type EventsApiToken = z.infer<typeof EventsApiTokenSchema>

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.cuid(),
  expiresAt: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string(),
  impersonatedBy: z.string().nullable(),
  activeOrganizationId: z.string().nullable(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.cuid(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  expiresAt: z.coerce.date().nullable(),
  password: z.string().nullable(),
  accessTokenExpiresAt: z.coerce.date().nullable(),
  refreshTokenExpiresAt: z.coerce.date().nullable(),
  scope: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Account = z.infer<typeof AccountSchema>

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.cuid(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
})

export type Verification = z.infer<typeof VerificationSchema>

/////////////////////////////////////////
// PASSKEY SCHEMA
/////////////////////////////////////////

export const PasskeySchema = z.object({
  id: z.cuid(),
  name: z.string().nullable(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullable(),
  createdAt: z.coerce.date().nullable(),
})

export type Passkey = z.infer<typeof PasskeySchema>

/////////////////////////////////////////
// TWO FACTOR SCHEMA
/////////////////////////////////////////

export const TwoFactorSchema = z.object({
  id: z.cuid(),
  secret: z.string(),
  backupCodes: z.string(),
  userId: z.string(),
})

export type TwoFactor = z.infer<typeof TwoFactorSchema>

/////////////////////////////////////////
// ORGANIZATION SCHEMA
/////////////////////////////////////////

export const OrganizationSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  createdAt: z.coerce.date(),
  metadata: z.string().nullable(),
  paymentsCustomerId: z.string().nullable(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  tags: z.string().array(),
  audienceQrCode: z.string().nullable(),
  memberQrCode: z.string().nullable(),
  contactInfo: z.string().nullable(),
  coverImage: z.string().nullable(),
  isPublic: z.boolean(),
  membershipRequirements: z.string().nullable(),
})

export type Organization = z.infer<typeof OrganizationSchema>

/////////////////////////////////////////
// MEMBER SCHEMA
/////////////////////////////////////////

export const MemberSchema = z.object({
  id: z.cuid(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.coerce.date(),
  invitedBy: z.string().nullable(),
  invitationId: z.string().nullable(),
})

export type Member = z.infer<typeof MemberSchema>

/////////////////////////////////////////
// ORGANIZATION APPLICATION SCHEMA
/////////////////////////////////////////

export const OrganizationApplicationSchema = z.object({
  status: ApplicationStatusSchema,
  id: z.cuid(),
  organizationId: z.string(),
  userId: z.string(),
  inviterId: z.string().nullable(),
  reason: z.string(),
  submittedAt: z.coerce.date(),
  reviewedAt: z.coerce.date().nullable(),
  reviewedBy: z.string().nullable(),
  reviewNote: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type OrganizationApplication = z.infer<typeof OrganizationApplicationSchema>

/////////////////////////////////////////
// ORGANIZATION INVITATION REQUEST SCHEMA
/////////////////////////////////////////

export const OrganizationInvitationRequestSchema = z.object({
  status: OrganizationInvitationRequestStatusSchema,
  id: z.cuid(),
  code: z.string(),
  organizationId: z.string(),
  inviterId: z.string(),
  inviteeName: z.string(),
  invitationReason: z.string(),
  eligibilityDetails: z.string(),
  applicationId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type OrganizationInvitationRequest = z.infer<typeof OrganizationInvitationRequestSchema>

/////////////////////////////////////////
// INVITATION SCHEMA
/////////////////////////////////////////

export const InvitationSchema = z.object({
  id: z.cuid(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  status: z.string(),
  expiresAt: z.coerce.date(),
  inviterId: z.string(),
  targetUserId: z.string().nullable(),
  metadata: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Invitation = z.infer<typeof InvitationSchema>

/////////////////////////////////////////
// PURCHASE SCHEMA
/////////////////////////////////////////

export const PurchaseSchema = z.object({
  type: PurchaseTypeSchema,
  id: z.cuid(),
  organizationId: z.string().nullable(),
  userId: z.string().nullable(),
  customerId: z.string(),
  subscriptionId: z.string().nullable(),
  productId: z.string(),
  status: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Purchase = z.infer<typeof PurchaseSchema>

/////////////////////////////////////////
// AI CHAT SCHEMA
/////////////////////////////////////////

export const AiChatSchema = z.object({
  id: z.cuid(),
  organizationId: z.string().nullable(),
  userId: z.string().nullable(),
  title: z.string().nullable(),
  /**
   * [Array<{role: "user" | "assistant"; content: string;}>]
   */
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AiChat = z.infer<typeof AiChatSchema>

/////////////////////////////////////////
// PROJECT SCHEMA
/////////////////////////////////////////

export const ProjectSchema = z.object({
  stage: ProjectStageSchema,
  pricingType: PricingTypeSchema.nullable(),
  id: z.cuid(),
  shortId: z.string().nullable(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  tagline: z.string().nullable(),
  url: z.string().nullable(),
  featured: z.boolean(),
  order: z.number().int(),
  subtitle: z.string().nullable(),
  screenshots: z.string().array(),
  projectTags: z.string().array(),
  milestones: z.string().array(),
  demoVideoUrl: z.string().nullable(),
  isRecruiting: z.boolean(),
  recruitmentStatus: z.string().nullable(),
  recruitmentTags: z.string().array(),
  teamDescription: z.string().nullable(),
  teamSkills: z.string().array(),
  teamSize: z.number().int().nullable(),
  contactInfo: z.string().nullable(),
  creationExperience: z.string().nullable(),
  isComplete: z.boolean(),
  completionScore: z.number().int(),
  communityUseAuth: z.boolean(),
  customFields: JsonValueSchema.nullable(),
  isSubmission: z.boolean(),
  submittedAt: z.coerce.date().nullable(),
  viewCount: z.number().int(),
  likeCount: z.number().int(),
  commentCount: z.number().int(),
  submissionCount: z.number().int(),
  awardCount: z.number().int(),
  githubUrl: z.string().nullable(),
  slidesUrl: z.string().nullable(),
  inspiration: z.string().nullable(),
  challenges: z.string().nullable(),
  learnings: z.string().nullable(),
  nextSteps: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Project = z.infer<typeof ProjectSchema>

/////////////////////////////////////////
// PROJECT MEMBER SCHEMA
/////////////////////////////////////////

export const ProjectMemberSchema = z.object({
  id: z.cuid(),
  projectId: z.string(),
  userId: z.string(),
  role: z.string(),
  joinedAt: z.coerce.date(),
})

export type ProjectMember = z.infer<typeof ProjectMemberSchema>

/////////////////////////////////////////
// PROJECT ATTACHMENT SCHEMA
/////////////////////////////////////////

export const ProjectAttachmentSchema = z.object({
  id: z.cuid(),
  projectId: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  mimeType: z.string().nullable(),
  fileSize: z.number().int(),
  order: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ProjectAttachment = z.infer<typeof ProjectAttachmentSchema>

/////////////////////////////////////////
// PROJECT VOTE SCHEMA
/////////////////////////////////////////

export const ProjectVoteSchema = z.object({
  id: z.cuid(),
  projectId: z.string(),
  userId: z.string(),
  eventId: z.string(),
  createdAt: z.coerce.date(),
})

export type ProjectVote = z.infer<typeof ProjectVoteSchema>

/////////////////////////////////////////
// PROJECT LIKE SCHEMA
/////////////////////////////////////////

export const ProjectLikeSchema = z.object({
  id: z.cuid(),
  projectId: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
})

export type ProjectLike = z.infer<typeof ProjectLikeSchema>

/////////////////////////////////////////
// PROJECT BOOKMARK SCHEMA
/////////////////////////////////////////

export const ProjectBookmarkSchema = z.object({
  id: z.cuid(),
  projectId: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
})

export type ProjectBookmark = z.infer<typeof ProjectBookmarkSchema>

/////////////////////////////////////////
// COMMENT SCHEMA
/////////////////////////////////////////

export const CommentSchema = z.object({
  entityType: CommentEntityTypeSchema,
  status: CommentStatusSchema,
  id: z.cuid(),
  content: z.string(),
  userId: z.string(),
  entityId: z.string(),
  parentId: z.string().nullable(),
  replyToId: z.string().nullable(),
  isDeleted: z.boolean(),
  deletedAt: z.coerce.date().nullable(),
  deletedBy: z.string().nullable(),
  likeCount: z.number().int(),
  replyCount: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Comment = z.infer<typeof CommentSchema>

/////////////////////////////////////////
// COMMENT LIKE SCHEMA
/////////////////////////////////////////

export const CommentLikeSchema = z.object({
  id: z.cuid(),
  commentId: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
})

export type CommentLike = z.infer<typeof CommentLikeSchema>

/////////////////////////////////////////
// PROJECT COMMENT SCHEMA
/////////////////////////////////////////

export const ProjectCommentSchema = z.object({
  id: z.cuid(),
  projectId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ProjectComment = z.infer<typeof ProjectCommentSchema>

/////////////////////////////////////////
// EVENT SCHEMA
/////////////////////////////////////////

export const EventSchema = z.object({
  type: EventTypeSchema,
  status: EventStatusSchema,
  id: z.cuid(),
  shortId: z.string().nullable(),
  title: z.string(),
  shortDescription: z.string().nullable(),
  richContent: z.string().nullable(),
  contentImages: z.string().array(),
  organizerId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  timezone: z.string(),
  isOnline: z.boolean(),
  address: z.string().nullable(),
  organizationId: z.string().nullable(),
  onlineUrl: z.string().nullable(),
  isExternalEvent: z.boolean(),
  externalUrl: z.string().nullable(),
  maxAttendees: z.number().int().nullable(),
  registrationDeadline: z.coerce.date().nullable(),
  requireApproval: z.boolean(),
  registrationSuccessInfo: z.string().nullable(),
  registrationSuccessImage: z.string().nullable(),
  registrationPendingInfo: z.string().nullable(),
  registrationPendingImage: z.string().nullable(),
  registrationFieldConfig: JsonValueSchema.nullable(),
  coverImage: z.string().nullable(),
  tags: z.string().array(),
  featured: z.boolean(),
  volunteerContactInfo: z.string().nullable(),
  volunteerWechatQrCode: z.string().nullable(),
  organizerContact: z.string().nullable(),
  templateId: z.string().nullable(),
  requireProjectSubmission: z.boolean(),
  projectSubmissionDeadline: z.coerce.date().nullable(),
  askDigitalCardConsent: z.boolean(),
  submissionsEnabled: z.boolean().nullable(),
  hackathonConfig: JsonValueSchema.nullable(),
  registrationOpen: z.boolean(),
  submissionsOpen: z.boolean(),
  votingOpen: z.boolean(),
  showVotesOnGallery: z.boolean(),
  feedbackConfig: JsonValueSchema.nullable(),
  submissionFormConfig: JsonValueSchema.nullable(),
  viewCount: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Event = z.infer<typeof EventSchema>

/////////////////////////////////////////
// EVENT TICKET TYPE SCHEMA
/////////////////////////////////////////

export const EventTicketTypeSchema = z.object({
  id: z.cuid(),
  eventId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  maxQuantity: z.number().int().nullable(),
  currentQuantity: z.number().int(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventTicketType = z.infer<typeof EventTicketTypeSchema>

/////////////////////////////////////////
// EVENT TICKET PRICE TIER SCHEMA
/////////////////////////////////////////

export const EventTicketPriceTierSchema = z.object({
  id: z.cuid(),
  ticketTypeId: z.string(),
  quantity: z.number().int(),
  price: z.number(),
  currency: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventTicketPriceTier = z.infer<typeof EventTicketPriceTierSchema>

/////////////////////////////////////////
// EVENT ORDER SCHEMA
/////////////////////////////////////////

export const EventOrderSchema = z.object({
  status: EventOrderStatusSchema,
  paymentMethod: PaymentMethodSchema.nullable(),
  id: z.cuid(),
  orderNo: z.string(),
  eventId: z.string(),
  userId: z.string(),
  ticketTypeId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().nullable(),
  totalAmount: z.number(),
  currency: z.string(),
  transactionId: z.string().nullable(),
  paidAt: z.coerce.date().nullable(),
  prepayId: z.string().nullable(),
  codeUrl: z.string().nullable(),
  refundId: z.string().nullable(),
  refundAmount: z.number().nullable(),
  refundedAt: z.coerce.date().nullable(),
  refundReason: z.string().nullable(),
  refundedBy: z.string().nullable(),
  expiredAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventOrder = z.infer<typeof EventOrderSchema>

/////////////////////////////////////////
// EVENT ORDER INVITE SCHEMA
/////////////////////////////////////////

export const EventOrderInviteSchema = z.object({
  status: EventOrderInviteStatusSchema,
  id: z.cuid(),
  orderId: z.string(),
  code: z.string(),
  redeemedAt: z.coerce.date().nullable(),
  redeemedBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventOrderInvite = z.infer<typeof EventOrderInviteSchema>

/////////////////////////////////////////
// EVENT PHOTO SCHEMA
/////////////////////////////////////////

export const EventPhotoSchema = z.object({
  id: z.cuid(),
  eventId: z.string(),
  userId: z.string(),
  imageUrl: z.string(),
  watermarkedUrl: z.string().nullable(),
  caption: z.string().nullable(),
  isApproved: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventPhoto = z.infer<typeof EventPhotoSchema>

/////////////////////////////////////////
// EVENT ADMIN SCHEMA
/////////////////////////////////////////

export const EventAdminSchema = z.object({
  role: EventAdminRoleSchema,
  status: EventAdminStatusSchema,
  id: z.cuid(),
  eventId: z.string(),
  userId: z.string().nullable(),
  email: z.string(),
  invitedBy: z.string(),
  invitedAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
  canEditEvent: z.boolean(),
  canManageRegistrations: z.boolean(),
  canManageAdmins: z.boolean(),
})

export type EventAdmin = z.infer<typeof EventAdminSchema>

/////////////////////////////////////////
// EVENT REGISTRATION SCHEMA
/////////////////////////////////////////

export const EventRegistrationSchema = z.object({
  status: RegistrationStatusSchema,
  id: z.cuid(),
  eventId: z.string(),
  userId: z.string(),
  ticketTypeId: z.string().nullable(),
  orderId: z.string().nullable(),
  orderInviteId: z.string().nullable(),
  inviteId: z.string().nullable(),
  registeredAt: z.coerce.date(),
  note: z.string().nullable(),
  allowDigitalCardDisplay: z.boolean().nullable(),
  reviewedAt: z.coerce.date().nullable(),
  reviewedBy: z.string().nullable(),
  reviewNote: z.string().nullable(),
})

export type EventRegistration = z.infer<typeof EventRegistrationSchema>

/////////////////////////////////////////
// EVENT QUESTION SCHEMA
/////////////////////////////////////////

export const EventQuestionSchema = z.object({
  type: QuestionTypeSchema,
  id: z.cuid(),
  eventId: z.string(),
  question: z.string(),
  description: z.string().nullable(),
  options: z.string().array(),
  required: z.boolean(),
  order: z.number().int(),
})

export type EventQuestion = z.infer<typeof EventQuestionSchema>

/////////////////////////////////////////
// EVENT ANSWER SCHEMA
/////////////////////////////////////////

export const EventAnswerSchema = z.object({
  id: z.cuid(),
  questionId: z.string(),
  userId: z.string(),
  eventId: z.string(),
  registrationId: z.string(),
  answer: z.string(),
})

export type EventAnswer = z.infer<typeof EventAnswerSchema>

/////////////////////////////////////////
// EVENT CHECK IN SCHEMA
/////////////////////////////////////////

export const EventCheckInSchema = z.object({
  id: z.cuid(),
  eventId: z.string(),
  userId: z.string(),
  checkedInAt: z.coerce.date(),
  checkedInBy: z.string().nullable(),
})

export type EventCheckIn = z.infer<typeof EventCheckInSchema>

/////////////////////////////////////////
// EVENT FEEDBACK SCHEMA
/////////////////////////////////////////

export const EventFeedbackSchema = z.object({
  id: z.cuid(),
  eventId: z.string(),
  userId: z.string(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  suggestions: z.string().nullable(),
  wouldRecommend: z.boolean(),
  customAnswers: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
})

export type EventFeedback = z.infer<typeof EventFeedbackSchema>

/////////////////////////////////////////
// EVENT INVITE SCHEMA
/////////////////////////////////////////

export const EventInviteSchema = z.object({
  type: EventInviteTypeSchema,
  id: z.cuid(),
  eventId: z.string(),
  code: z.string(),
  label: z.string().nullable(),
  issuedByUserId: z.string().nullable(),
  createdAt: z.coerce.date(),
  lastUsedAt: z.coerce.date().nullable(),
})

export type EventInvite = z.infer<typeof EventInviteSchema>

/////////////////////////////////////////
// CONTRIBUTION SCHEMA
/////////////////////////////////////////

export const ContributionSchema = z.object({
  type: ContributionTypeSchema,
  status: ContributionStatusSchema,
  id: z.cuid(),
  userId: z.string(),
  category: z.string(),
  description: z.string(),
  cpValue: z.number().int(),
  sourceId: z.string().nullable(),
  sourceType: z.string().nullable(),
  isAutomatic: z.boolean(),
  organizationId: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.coerce.date().nullable(),
  reviewNote: z.string().nullable(),
  evidence: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Contribution = z.infer<typeof ContributionSchema>

/////////////////////////////////////////
// BADGE SCHEMA
/////////////////////////////////////////

export const BadgeSchema = z.object({
  rarity: BadgeRaritySchema,
  id: z.cuid(),
  name: z.string(),
  description: z.string(),
  iconUrl: z.string().nullable(),
  color: z.string().nullable(),
  isActive: z.boolean(),
  isAutoAwarded: z.boolean(),
  conditions: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Badge = z.infer<typeof BadgeSchema>

/////////////////////////////////////////
// USER BADGE SCHEMA
/////////////////////////////////////////

export const UserBadgeSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  badgeId: z.string(),
  awardedBy: z.string().nullable(),
  reason: z.string().nullable(),
  awardedAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
})

export type UserBadge = z.infer<typeof UserBadgeSchema>

/////////////////////////////////////////
// ADMIN LOG SCHEMA
/////////////////////////////////////////

export const AdminLogSchema = z.object({
  id: z.cuid(),
  adminId: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  details: JsonValueSchema,
  createdAt: z.coerce.date(),
})

export type AdminLog = z.infer<typeof AdminLogSchema>

/////////////////////////////////////////
// SYSTEM CONFIG SCHEMA
/////////////////////////////////////////

export const SystemConfigSchema = z.object({
  id: z.cuid(),
  key: z.string(),
  value: JsonValueSchema,
  description: z.string().nullable(),
  updatedBy: z.string(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type SystemConfig = z.infer<typeof SystemConfigSchema>

/////////////////////////////////////////
// COMMUNITY TASK SCHEMA
/////////////////////////////////////////

export const CommunityTaskSchema = z.object({
  category: TaskCategorySchema,
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  id: z.cuid(),
  title: z.string(),
  description: z.string(),
  cpReward: z.number().int(),
  deadline: z.coerce.date().nullable(),
  publisherId: z.string(),
  organizationId: z.string().nullable(),
  isUserTask: z.boolean(),
  assigneeId: z.string().nullable(),
  claimedAt: z.coerce.date().nullable(),
  submittedAt: z.coerce.date().nullable(),
  submissionNote: z.string().nullable(),
  evidenceUrls: z.string().array(),
  reviewedAt: z.coerce.date().nullable(),
  reviewNote: z.string().nullable(),
  tags: z.string().array(),
  featured: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type CommunityTask = z.infer<typeof CommunityTaskSchema>

/////////////////////////////////////////
// EMAIL CAMPAIGN SCHEMA
/////////////////////////////////////////

export const EmailCampaignSchema = z.object({
  type: EmailCampaignTypeSchema,
  scope: EmailScopeSchema,
  status: CampaignStatusSchema,
  id: z.cuid(),
  title: z.string(),
  description: z.string().nullable(),
  organizationId: z.string().nullable(),
  createdBy: z.string(),
  templateId: z.string(),
  subject: z.string(),
  content: JsonValueSchema,
  scheduledAt: z.coerce.date().nullable(),
  sentAt: z.coerce.date().nullable(),
  /**
   * [Object]
   */
  audienceConfig: z.object({}),
  recipientCount: z.number().int(),
  sentCount: z.number().int(),
  deliveredCount: z.number().int(),
  openedCount: z.number().int(),
  clickedCount: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EmailCampaign = z.infer<typeof EmailCampaignSchema>

/////////////////////////////////////////
// EMAIL JOB SCHEMA
/////////////////////////////////////////

export const EmailJobSchema = z.object({
  status: JobStatusSchema,
  id: z.cuid(),
  campaignId: z.string(),
  recipient: z.string(),
  userId: z.string().nullable(),
  scheduledAt: z.coerce.date(),
  sentAt: z.coerce.date().nullable(),
  deliveredAt: z.coerce.date().nullable(),
  openedAt: z.coerce.date().nullable(),
  clickedAt: z.coerce.date().nullable(),
  errorMessage: z.string().nullable(),
  retryCount: z.number().int(),
  /**
   * [Object]
   */
  context: z.object({}),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EmailJob = z.infer<typeof EmailJobSchema>

/////////////////////////////////////////
// USER EMAIL PREFERENCE SCHEMA
/////////////////////////////////////////

export const UserEmailPreferenceSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  subscribeNewsletter: z.boolean(),
  subscribeMarketing: z.boolean(),
  subscribeNotification: z.boolean(),
  subscribeEvents: z.boolean(),
  /**
   * [Object]
   */
  organizationEmails: z.object({}),
  unsubscribedAt: z.coerce.date().nullable(),
  unsubscribeToken: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type UserEmailPreference = z.infer<typeof UserEmailPreferenceSchema>

/////////////////////////////////////////
// EVENT HOST SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const EventHostSubscriptionSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  organizationId: z.string().nullable(),
  hostUserId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  unsubscribedAt: z.coerce.date().nullable(),
})

export type EventHostSubscription = z.infer<typeof EventHostSubscriptionSchema>

/////////////////////////////////////////
// USER FOLLOW SCHEMA
/////////////////////////////////////////

export const UserFollowSchema = z.object({
  id: z.cuid(),
  followerId: z.string(),
  followingId: z.string(),
  createdAt: z.coerce.date(),
})

export type UserFollow = z.infer<typeof UserFollowSchema>

/////////////////////////////////////////
// EVENT BOOKMARK SCHEMA
/////////////////////////////////////////

export const EventBookmarkSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  eventId: z.string(),
  createdAt: z.coerce.date(),
})

export type EventBookmark = z.infer<typeof EventBookmarkSchema>

/////////////////////////////////////////
// USER LIKE SCHEMA
/////////////////////////////////////////

export const UserLikeSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  likedUserId: z.string(),
  createdAt: z.coerce.date(),
})

export type UserLike = z.infer<typeof UserLikeSchema>

/////////////////////////////////////////
// EVENT LIKE SCHEMA
/////////////////////////////////////////

export const EventLikeSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  eventId: z.string(),
  createdAt: z.coerce.date(),
})

export type EventLike = z.infer<typeof EventLikeSchema>

/////////////////////////////////////////
// WEBSITE SCHEMA
/////////////////////////////////////////

export const WebsiteSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  url: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  tags: z.string().array(),
  favicon: z.string().nullable(),
  screenshot: z.string().nullable(),
  submittedBy: z.string(),
  organizationId: z.string().nullable(),
  isApproved: z.boolean(),
  approvedBy: z.string().nullable(),
  approvedAt: z.coerce.date().nullable(),
  likeCount: z.number().int(),
  viewCount: z.number().int(),
  clickCount: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Website = z.infer<typeof WebsiteSchema>

/////////////////////////////////////////
// WEBSITE LIKE SCHEMA
/////////////////////////////////////////

export const WebsiteLikeSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  websiteId: z.string(),
  createdAt: z.coerce.date(),
})

export type WebsiteLike = z.infer<typeof WebsiteLikeSchema>

/////////////////////////////////////////
// NOTIFICATION SCHEMA
/////////////////////////////////////////

export const NotificationSchema = z.object({
  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema,
  id: z.cuid(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  metadata: JsonValueSchema.nullable(),
  read: z.boolean(),
  readAt: z.coerce.date().nullable(),
  actionUrl: z.string().nullable(),
  relatedUserId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Notification = z.infer<typeof NotificationSchema>

/////////////////////////////////////////
// NOTIFICATION PREFERENCE SCHEMA
/////////////////////////////////////////

export const NotificationPreferenceSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  projectCommentEmail: z.boolean(),
  projectCommentPush: z.boolean(),
  projectLikeEmail: z.boolean(),
  projectLikePush: z.boolean(),
  organizationEmail: z.boolean(),
  organizationPush: z.boolean(),
  eventEmail: z.boolean(),
  eventPush: z.boolean(),
  eventReminderEmail: z.boolean(),
  systemEmail: z.boolean(),
  systemPush: z.boolean(),
  socialEmail: z.boolean(),
  socialPush: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>

/////////////////////////////////////////
// EMAIL NOTIFICATION QUEUE SCHEMA
/////////////////////////////////////////

export const EmailNotificationQueueSchema = z.object({
  priority: NotificationPrioritySchema,
  status: EmailStatusSchema,
  id: z.cuid(),
  userId: z.string(),
  notificationId: z.string().nullable(),
  emailType: z.string(),
  emailData: JsonValueSchema,
  scheduledAt: z.coerce.date(),
  sentAt: z.coerce.date().nullable(),
  errorMessage: z.string().nullable(),
  retryCount: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EmailNotificationQueue = z.infer<typeof EmailNotificationQueueSchema>

/////////////////////////////////////////
// VOLUNTEER ROLE SCHEMA
/////////////////////////////////////////

export const VolunteerRoleSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  description: z.string(),
  detailDescription: z.string().nullable(),
  iconUrl: z.string().nullable(),
  cpPoints: z.number().int(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type VolunteerRole = z.infer<typeof VolunteerRoleSchema>

/////////////////////////////////////////
// EVENT VOLUNTEER ROLE SCHEMA
/////////////////////////////////////////

export const EventVolunteerRoleSchema = z.object({
  id: z.cuid(),
  eventId: z.string(),
  volunteerRoleId: z.string(),
  recruitCount: z.number().int(),
  description: z.string().nullable(),
  requireApproval: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventVolunteerRole = z.infer<typeof EventVolunteerRoleSchema>

/////////////////////////////////////////
// EVENT VOLUNTEER REGISTRATION SCHEMA
/////////////////////////////////////////

export const EventVolunteerRegistrationSchema = z.object({
  status: VolunteerStatusSchema,
  id: z.cuid(),
  eventId: z.string(),
  userId: z.string(),
  eventVolunteerRoleId: z.string(),
  appliedAt: z.coerce.date(),
  approvedAt: z.coerce.date().nullable(),
  approvedBy: z.string().nullable(),
  rejectedAt: z.coerce.date().nullable(),
  rejectedBy: z.string().nullable(),
  note: z.string().nullable(),
  checkedIn: z.boolean(),
  checkedInAt: z.coerce.date().nullable(),
  completed: z.boolean(),
  completedAt: z.coerce.date().nullable(),
  cpAwarded: z.boolean(),
})

export type EventVolunteerRegistration = z.infer<typeof EventVolunteerRegistrationSchema>

/////////////////////////////////////////
// EVENT TEMPLATE SCHEMA
/////////////////////////////////////////

export const EventTemplateSchema = z.object({
  type: EventTemplateTypeSchema,
  templateType: EventTemplateCategorySchema,
  id: z.cuid(),
  name: z.string(),
  description: z.string(),
  title: z.string(),
  defaultDescription: z.string(),
  shortDescription: z.string().nullable(),
  duration: z.number().int().nullable(),
  maxAttendees: z.number().int().nullable(),
  requireApproval: z.boolean(),
  isSystemTemplate: z.boolean(),
  isFeatured: z.boolean(),
  isPublic: z.boolean(),
  isActive: z.boolean(),
  createdBy: z.string().nullable(),
  organizationId: z.string().nullable(),
  originalEventId: z.string().nullable(),
  usageCount: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventTemplate = z.infer<typeof EventTemplateSchema>

/////////////////////////////////////////
// EVENT TEMPLATE TICKET TYPE SCHEMA
/////////////////////////////////////////

export const EventTemplateTicketTypeSchema = z.object({
  id: z.cuid(),
  templateId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  maxQuantity: z.number().int().nullable(),
  isDefault: z.boolean(),
  sortOrder: z.number().int(),
  requirements: z.string().nullable(),
})

export type EventTemplateTicketType = z.infer<typeof EventTemplateTicketTypeSchema>

/////////////////////////////////////////
// EVENT TEMPLATE VOLUNTEER ROLE SCHEMA
/////////////////////////////////////////

export const EventTemplateVolunteerRoleSchema = z.object({
  id: z.cuid(),
  templateId: z.string(),
  volunteerRoleId: z.string(),
  recruitCount: z.number().int(),
  description: z.string().nullable(),
  requireApproval: z.boolean(),
  cpReward: z.number().int(),
})

export type EventTemplateVolunteerRole = z.infer<typeof EventTemplateVolunteerRoleSchema>

/////////////////////////////////////////
// EVENT TEMPLATE QUESTION SCHEMA
/////////////////////////////////////////

export const EventTemplateQuestionSchema = z.object({
  type: QuestionTypeSchema,
  id: z.cuid(),
  templateId: z.string(),
  question: z.string(),
  options: z.string().array(),
  required: z.boolean(),
  targetRole: z.string().nullable(),
  order: z.number().int(),
})

export type EventTemplateQuestion = z.infer<typeof EventTemplateQuestionSchema>

/////////////////////////////////////////
// EVENT TEMPLATE SCHEDULE SCHEMA
/////////////////////////////////////////

export const EventTemplateScheduleSchema = z.object({
  type: ScheduleTypeSchema,
  id: z.cuid(),
  templateId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startMinute: z.number().int(),
  duration: z.number().int(),
  order: z.number().int(),
})

export type EventTemplateSchedule = z.infer<typeof EventTemplateScheduleSchema>

/////////////////////////////////////////
// EVENT PROJECT SUBMISSION SCHEMA
/////////////////////////////////////////

export const EventProjectSubmissionSchema = z.object({
  submissionType: SubmissionTypeSchema,
  status: SubmissionStatusSchema,
  id: z.cuid(),
  eventId: z.string(),
  projectId: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  demoUrl: z.string().nullable(),
  sourceCode: z.string().nullable(),
  presentationUrl: z.string().nullable(),
  submittedAt: z.coerce.date(),
  reviewedAt: z.coerce.date().nullable(),
  reviewedBy: z.string().nullable(),
  reviewNote: z.string().nullable(),
  judgeScore: z.number().nullable(),
  audienceScore: z.number().nullable(),
  finalScore: z.number().nullable(),
  projectSnapshot: JsonValueSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventProjectSubmission = z.infer<typeof EventProjectSubmissionSchema>

/////////////////////////////////////////
// AWARD SCHEMA
/////////////////////////////////////////

export const AwardSchema = z.object({
  category: AwardCategorySchema,
  level: AwardLevelSchema,
  id: z.cuid(),
  name: z.string(),
  description: z.string(),
  iconUrl: z.string().nullable(),
  badgeUrl: z.string().nullable(),
  certificateTemplate: z.string().nullable(),
  color: z.string().nullable(),
  isActive: z.boolean(),
  cpReward: z.number().int(),
  sortOrder: z.number().int(),
  createdBy: z.string().nullable(),
  organizationId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Award = z.infer<typeof AwardSchema>

/////////////////////////////////////////
// PROJECT AWARD SCHEMA
/////////////////////////////////////////

export const ProjectAwardSchema = z.object({
  id: z.cuid(),
  projectId: z.string(),
  awardId: z.string(),
  eventId: z.string().nullable(),
  submissionId: z.string().nullable(),
  awardedAt: z.coerce.date(),
  awardedBy: z.string(),
  reason: z.string().nullable(),
  score: z.number().nullable(),
  certificateUrl: z.string().nullable(),
  certificateGenerated: z.boolean(),
})

export type ProjectAward = z.infer<typeof ProjectAwardSchema>

/////////////////////////////////////////
// EVENT AI RECOMMENDATION SCHEMA
/////////////////////////////////////////

export const EventAIRecommendationSchema = z.object({
  type: RecommendationTypeSchema,
  id: z.cuid(),
  eventId: z.string(),
  userId: z.string().nullable(),
  recommendations: JsonValueSchema,
  metadata: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
})

export type EventAIRecommendation = z.infer<typeof EventAIRecommendationSchema>

/////////////////////////////////////////
// RECOMMENDATION FEEDBACK SCHEMA
/////////////////////////////////////////

export const RecommendationFeedbackSchema = z.object({
  id: z.cuid(),
  recommendationId: z.string(),
  userId: z.string(),
  helpful: z.boolean(),
  comment: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export type RecommendationFeedback = z.infer<typeof RecommendationFeedbackSchema>

/////////////////////////////////////////
// EVENT COMMUNICATION SCHEMA
/////////////////////////////////////////

export const EventCommunicationSchema = z.object({
  type: CommunicationTypeSchema,
  status: CommunicationStatusSchema,
  id: z.cuid(),
  eventId: z.string(),
  sentBy: z.string(),
  subject: z.string(),
  content: z.string(),
  totalRecipients: z.number().int(),
  sentCount: z.number().int(),
  deliveredCount: z.number().int(),
  failedCount: z.number().int(),
  scheduledAt: z.coerce.date().nullable(),
  sentAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventCommunication = z.infer<typeof EventCommunicationSchema>

/////////////////////////////////////////
// EVENT COMMUNICATION RECORD SCHEMA
/////////////////////////////////////////

export const EventCommunicationRecordSchema = z.object({
  status: CommunicationRecordStatusSchema,
  id: z.cuid(),
  communicationId: z.string(),
  eventId: z.string(),
  recipientId: z.string(),
  recipientEmail: z.string().nullable(),
  recipientPhone: z.string().nullable(),
  sentAt: z.coerce.date().nullable(),
  deliveredAt: z.coerce.date().nullable(),
  readAt: z.coerce.date().nullable(),
  errorMessage: z.string().nullable(),
  retryCount: z.number().int(),
  externalMessageId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EventCommunicationRecord = z.infer<typeof EventCommunicationRecordSchema>

/////////////////////////////////////////
// EVENT PARTICIPANT INTEREST SCHEMA
/////////////////////////////////////////

export const EventParticipantInterestSchema = z.object({
  id: z.cuid(),
  eventId: z.string(),
  interestedUserId: z.string(),
  targetUserId: z.string(),
  createdAt: z.coerce.date(),
})

export type EventParticipantInterest = z.infer<typeof EventParticipantInterestSchema>

/////////////////////////////////////////
// FUNCTIONAL ROLE SCHEMA
/////////////////////////////////////////

export const FunctionalRoleSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  description: z.string(),
  applicableScope: z.string().nullable(),
  organizationId: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type FunctionalRole = z.infer<typeof FunctionalRoleSchema>

/////////////////////////////////////////
// ROLE ASSIGNMENT SCHEMA
/////////////////////////////////////////

export const RoleAssignmentSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  organizationId: z.string(),
  functionalRoleId: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>

/////////////////////////////////////////
// POST SCHEMA
/////////////////////////////////////////

export const PostSchema = z.object({
  channel: PostChannelSchema,
  id: z.cuid(),
  userId: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  images: z.string().array(),
  linkedProjectId: z.string().nullable(),
  linkedEventId: z.string().nullable(),
  likeCount: z.number().int(),
  commentCount: z.number().int(),
  viewCount: z.number().int(),
  pinned: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Post = z.infer<typeof PostSchema>

/////////////////////////////////////////
// POST LIKE SCHEMA
/////////////////////////////////////////

export const PostLikeSchema = z.object({
  id: z.cuid(),
  postId: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
})

export type PostLike = z.infer<typeof PostLikeSchema>

/////////////////////////////////////////
// POST BOOKMARK SCHEMA
/////////////////////////////////////////

export const PostBookmarkSchema = z.object({
  id: z.cuid(),
  postId: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
})

export type PostBookmark = z.infer<typeof PostBookmarkSchema>
