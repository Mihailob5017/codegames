import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { HttpError } from '../../types/common/error-types';
import { htmlTemplate } from '../../templates/html';
import { textTemplate } from '../../templates/text';

export interface IEmailService {
	sendVerificationEmail(email: string, token: number): Promise<void>;
}

export class EmailService implements IEmailService {
	private transporter: Transporter;

	constructor(transporter?: Transporter) {
		if (transporter) {
			this.transporter = transporter;
		} else {
			this.transporter = this.createTransporter();
		}
	}

	private createTransporter(): Transporter {
		const user = process.env.NODEMAILER_EMAIL;
		const pass = process.env.NODEMAILER_PASSWORD;

		if (!user || !pass) {
			throw new HttpError(500, 'Email configuration is missing');
		}

		return nodemailer.createTransport({
			service: 'gmail',
			auth: { user, pass },
		});
	}

	public async sendVerificationEmail(
		email: string,
		token: number
	): Promise<void> {
		try {
			this.validateEmailInputs(email, token);

			const mailOptions = {
				from: process.env.NODEMAILER_EMAIL,
				to: email,
				subject: 'Email Verification - OTP',
				html: htmlTemplate(token),
				text: textTemplate(token),
			};

			await this.transporter.sendMail(mailOptions);
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new HttpError(500, `Failed to send verification email: ${error}`);
		}
	}

	private validateEmailInputs(email: string, token: number): void {
		if (!email || typeof email !== 'string') {
			throw new HttpError(400, 'Valid email address is required');
		}

		if (token === null || token === undefined || typeof token !== 'number') {
			throw new HttpError(400, 'Valid token is required');
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new HttpError(400, 'Invalid email format');
		}
	}
}