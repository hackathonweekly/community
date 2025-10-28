import { EmailVerification } from "./EmailVerification";
import { ForgotPassword } from "./ForgotPassword";
import { MagicLink } from "./MagicLink";
import { NewUser } from "./NewUser";
import { NewsletterSignup } from "./NewsletterSignup";
import { OrganizationInvitation } from "./OrganizationInvitation";
import { OrganizationNotification } from "./OrganizationNotification";
import { OrganizationApplicationReceived } from "./OrganizationApplicationReceived";
import { OrganizationApplicationApproved } from "./OrganizationApplicationApproved";
import { OrganizationApplicationRejected } from "./OrganizationApplicationRejected";
import { EventRegistrationConfirmation } from "./EventRegistrationConfirmation";
import { EventRegistrationApproved } from "./EventRegistrationApproved";
import { EventRegistrationRejected } from "./EventRegistrationRejected";
import { EventReminder } from "./EventReminder";
import { EventUpdate } from "./EventUpdate";
import { EventFeedbackRequest } from "./EventFeedbackRequest";
import { EventHostNewEvent } from "./EventHostNewEvent";
import { WeeklyReportGlobal } from "./WeeklyReportGlobal";
import { WeeklyReportOrganization } from "./WeeklyReportOrganization";
import { BulkNotification } from "./BulkNotification";
import { MarketingCampaign } from "./MarketingCampaign";
import { SystemAnnouncement } from "./SystemAnnouncement";
import { SimplifiedEmail } from "./SimplifiedEmail";

export const mailTemplates = {
	// Auth templates
	magicLink: MagicLink,
	forgotPassword: ForgotPassword,
	newUser: NewUser,
	newsletterSignup: NewsletterSignup,
	emailVerification: EmailVerification,

	// Organization templates
	organizationInvitation: OrganizationInvitation,
	organizationNotification: OrganizationNotification,
	organizationApplicationReceived: OrganizationApplicationReceived,
	organizationApplicationApproved: OrganizationApplicationApproved,
	organizationApplicationRejected: OrganizationApplicationRejected,

	// Event templates
	eventRegistrationConfirmation: EventRegistrationConfirmation,
	eventRegistrationApproved: EventRegistrationApproved,
	eventRegistrationRejected: EventRegistrationRejected,
	eventReminder: EventReminder,
	eventUpdate: EventUpdate,
	eventFeedbackRequest: EventFeedbackRequest,
	eventHostNewEvent: EventHostNewEvent,

	// Campaign templates
	weeklyReportGlobal: WeeklyReportGlobal,
	weeklyReportOrganization: WeeklyReportOrganization,
	bulkNotification: BulkNotification,
	marketingCampaign: MarketingCampaign,
	systemAnnouncement: SystemAnnouncement,

	// Simplified template for admin email sending
	simplifiedEmail: SimplifiedEmail,
} as const;
