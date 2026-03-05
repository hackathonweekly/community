"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@community/ui/ui/alert-dialog";
import { Button } from "@community/ui/ui/button";
import {
	type PropsWithChildren,
	createContext,
	useContext,
	useState,
} from "react";

type ConfirmOptions = {
	title: string;
	message?: string;
	cancelLabel?: string;
	confirmLabel?: string;
	destructive?: boolean;
	onConfirm: () => Promise<void> | void;
};
const ConfirmationAlertContext = createContext<{
	confirm: (options: ConfirmOptions) => void;
}>({
	confirm: async () => false,
});

export function ConfirmationAlertProvider({ children }: PropsWithChildren) {
	const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(
		null,
	);

	const confirm = (options: ConfirmOptions) => {
		setConfirmOptions(options);
	};

	return (
		<ConfirmationAlertContext.Provider value={{ confirm }}>
			{children}

			<AlertDialog
				open={!!confirmOptions}
				onOpenChange={(open) =>
					setConfirmOptions(open ? confirmOptions : null)
				}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirmOptions?.title}
						</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						{confirmOptions?.message}
					</AlertDialogDescription>

					<AlertDialogFooter>
						<AlertDialogCancel>
							{confirmOptions?.cancelLabel ?? "取消"}
						</AlertDialogCancel>
						<Button
							variant={
								confirmOptions?.destructive
									? "destructive"
									: "default"
							}
							onClick={async () => {
								await confirmOptions?.onConfirm();
								setConfirmOptions(null);
							}}
						>
							{confirmOptions?.confirmLabel ?? "确认"}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ConfirmationAlertContext.Provider>
	);
}

export const useConfirmationAlert = () => {
	const context = useContext(ConfirmationAlertContext);

	if (!context) {
		throw new Error(
			"useConfirmationAlert must be used within a ConfirmationAlertProvider",
		);
	}

	return context;
};
