import type { ContextType } from "react";
import { useContext } from "react";
import { SessionContext } from "../lib/session-context";

type SessionContextValue = Exclude<
	ContextType<typeof SessionContext>,
	undefined
>;

const emptySessionContext: SessionContextValue = {
	session: null,
	user: null,
	loaded: false,
	reloadSession: async () => {},
};

export const useOptionalSession = (): SessionContextValue => {
	return useContext(SessionContext) ?? emptySessionContext;
};

export const useSession = (): SessionContextValue => {
	const sessionContext = useContext(SessionContext);

	if (sessionContext === undefined) {
		throw new Error("useSession must be used within SessionProvider");
	}

	return sessionContext;
};
