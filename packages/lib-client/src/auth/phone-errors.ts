const PHONE_NUMBER_IN_USE_PATTERNS = [
	"phone number already exists",
	"phone number already in use",
	"phone number is already in use",
	"phone already exists",
	"phone already in use",
	"该手机号已被其他用户使用",
];

export function isPhoneNumberAlreadyInUseError(
	message?: string | null,
): boolean {
	if (!message) {
		return false;
	}

	const normalizedMessage = message.toLowerCase();

	return (
		PHONE_NUMBER_IN_USE_PATTERNS.some((pattern) =>
			normalizedMessage.includes(pattern),
		) ||
		(normalizedMessage.includes("already exists") &&
			normalizedMessage.includes("phone")) ||
		(normalizedMessage.includes("already in use") &&
			normalizedMessage.includes("phone")) ||
		(normalizedMessage.includes("unique constraint") &&
			normalizedMessage.includes("phonenumber")) ||
		(normalizedMessage.includes("p2002") &&
			normalizedMessage.includes("phone"))
	);
}
