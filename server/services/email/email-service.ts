import { HttpError } from '../../types/common/error-types';
import { htmlTemplate } from '../../templates/html';
import { textTemplate } from '../../templates/text';

const nodemailer = require('nodemailer');

interface IEmailService {
	sendVerificationEmail(email: string, token: number): Promise<void>;
}

export class EmailService implements IEmailService {
	private transporter: any;

	constructor() {
		const user = process.env.NODEMAILER_EMAIL;
		const pass = process.env.NODEMAILER_PASSWORD;

		if (!user || !pass) {
			throw new HttpError(500, 'Email configuration is missing');
		}

		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: { user, pass },
		});
	}

	public async sendVerificationEmail(
		email: string,
		token: number
	): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: process.env.NODEMAILER_EMAIL,
				to: email,
				subject: 'Email Verification - OTP',
				html: htmlTemplate(token),
				text: textTemplate(token),
			});
		} catch (error) {
			throw new HttpError(500, 'Failed to send verification email');
		}
	}
}
