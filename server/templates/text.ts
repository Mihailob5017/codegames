export const textTemplate = (token: number) => `
			Email Verification Required

			Thank you for signing up!
			
			Your verification token is: ${token}
			
			Please copy this token and paste it into the verification field in your application.
			
			Security Notice: This token will expire in 15 minutes.
			If you didn't request this verification, please ignore this email.
			
			This is an automated message, please do not reply to this email.
		`;
