import type { Session, User } from "@community/lib-server/auth";
import React from "react";

export const SessionContext = React.createContext<
	| {
			session: Session["session"] | null;
			user: User | null;
			loaded: boolean;
			reloadSession: () => Promise<void>;
	  }
	| undefined
>(undefined);
