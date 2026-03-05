import { Hono } from "hono";
import eventsRouter from "./events";
import registrationsRouter from "./registrations";
import organizationsRouter from "./organizations";
import { followsRouter } from "./follows";
import { eventBookmarksRouter } from "./event-bookmarks";
import { projectBookmarksRouter } from "./project-bookmarks";
import { bookmarksRouter } from "./combined-bookmarks";
import { likesRouter } from "./likes";
import interactiveUsersRouter from "./interactive-users";
import mutualFriendsRouter from "./mutual-friends";
import bookmarkedUsersExcludingMutualRouter from "./bookmarked-users-excluding-mutual";
import { privacySettingsRouter } from "./privacy-settings";

const userRouter = new Hono()
	.route("/events", eventsRouter)
	.route("/registrations", registrationsRouter)
	.route("/organizations", organizationsRouter)
	.route("/interactive-users", interactiveUsersRouter)
	.route("/mutual-friends", mutualFriendsRouter)
	.route(
		"/followed-users-excluding-mutual",
		bookmarkedUsersExcludingMutualRouter,
	)
	.route("/", privacySettingsRouter)
	.route("/", followsRouter)
	.route("/", eventBookmarksRouter)
	.route("/", projectBookmarksRouter)
	.route("/", bookmarksRouter)
	.route("/", likesRouter);

export { userRouter };
