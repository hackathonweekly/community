export const GET = async () => {
	// All files are now public, redirect users to update their configuration
	return new Response(
		"Image proxy is no longer needed. All files are now public and should be accessed directly.",
		{
			status: 410, // Gone
		},
	);
};
