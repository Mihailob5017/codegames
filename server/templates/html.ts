export const htmlTemplate = (token: number) => `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Email Verification</title>
				<style>
					body {
						font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
						line-height: 1.6;
						color: #333;
						margin: 0;
						padding: 0;
						background-color: #f4f4f4;
					}
					.container {
						max-width: 600px;
						margin: 20px auto;
						background: #ffffff;
						border-radius: 10px;
						box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
						overflow: hidden;
					}
					.header {
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						color: white;
						padding: 30px;
						text-align: center;
					}
					.header h1 {
						margin: 0;
						font-size: 24px;
						font-weight: 300;
					}
					.content {
						padding: 40px 30px;
						text-align: center;
					}
					.token-container {
						background: #f8f9fa;
						border: 2px dashed #667eea;
						border-radius: 8px;
						padding: 20px;
						margin: 25px 0;
						display: inline-block;
					}
					.token {
						font-family: 'Courier New', monospace;
						font-size: 32px;
						font-weight: bold;
						color: #667eea;
						letter-spacing: 3px;
						margin: 0;
					}
					.instructions {
						color: #666;
						margin: 20px 0;
						line-height: 1.8;
					}
					.warning {
						background: #fff3cd;
						border: 1px solid #ffeaa7;
						border-radius: 6px;
						padding: 15px;
						margin: 20px 0;
						color: #856404;
						font-size: 14px;
					}
					.footer {
						background: #f8f9fa;
						padding: 20px;
						text-align: center;
						font-size: 12px;
						color: #666;
						border-top: 1px solid #eee;
					}
					@media (max-width: 600px) {
						.container {
							margin: 10px;
							border-radius: 0;
						}
						.header, .content {
							padding: 20px;
						}
						.token {
							font-size: 24px;
						}
					}
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>🔐 Email Verification</h1>
					</div>
					<div class="content">
						<h2>Verify Your Account</h2>
						<p class="instructions">
							Thank you for signing up! Please use the verification token below to complete your account setup.
						</p>
						<div class="token-container">
							<p class="token">${token}</p>
						</div>
						<p class="instructions">
							Copy this token and paste it into the verification field in your application.
						</p>
						<div class="warning">
							⚠️ <strong>Security Notice:</strong> This token will expire in 15 minutes. 
							If you didn't request this verification, please ignore this email.
						</div>
					</div>
					<div class="footer">
						<p>This is an automated message, please do not reply to this email.</p>
						<p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
					</div>
				</div>
			</body>
			</html>
		`;
