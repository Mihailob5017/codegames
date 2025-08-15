import { EmailService, IEmailService } from './email-service';
import { Transporter } from 'nodemailer';
import { HttpError } from '../../types/common/error-types';
import * as nodemailer from 'nodemailer';
import { htmlTemplate } from '../../templates/html';
import { textTemplate } from '../../templates/text';

jest.mock('nodemailer');
jest.mock('../../templates/html');
jest.mock('../../templates/text');

describe('EmailService', () => {
	let emailService: EmailService;
	let mockTransporter: jest.Mocked<Transporter>;
	const originalEnv = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv };
		process.env.NODEMAILER_EMAIL = 'test@example.com';
		process.env.NODEMAILER_PASSWORD = 'testpassword';

		mockTransporter = {
			sendMail: jest.fn(),
		} as any;

		(nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
		(htmlTemplate as jest.Mock).mockReturnValue('<html>Mock HTML</html>');
		(textTemplate as jest.Mock).mockReturnValue('Mock Text');

		jest.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('constructor', () => {
		it('should create service with provided transporter', () => {
			const service = new EmailService(mockTransporter);
			expect(service).toBeInstanceOf(EmailService);
		});

		it('should create service with default transporter when none provided', () => {
			const service = new EmailService();
			expect(service).toBeInstanceOf(EmailService);
			expect(nodemailer.createTransport).toHaveBeenCalledWith({
				service: 'gmail',
				auth: {
					user: 'test@example.com',
					pass: 'testpassword',
				},
			});
		});

		it('should throw HttpError when email configuration is missing', () => {
			delete process.env.NODEMAILER_EMAIL;
			delete process.env.NODEMAILER_PASSWORD;

			expect(() => new EmailService()).toThrow(HttpError);
			expect(() => new EmailService()).toThrow('Email configuration is missing');
		});

		it('should throw HttpError when only email is missing', () => {
			delete process.env.NODEMAILER_EMAIL;

			expect(() => new EmailService()).toThrow(HttpError);
			expect(() => new EmailService()).toThrow('Email configuration is missing');
		});

		it('should throw HttpError when only password is missing', () => {
			delete process.env.NODEMAILER_PASSWORD;

			expect(() => new EmailService()).toThrow(HttpError);
			expect(() => new EmailService()).toThrow('Email configuration is missing');
		});
	});

	describe('sendVerificationEmail', () => {
		beforeEach(() => {
			emailService = new EmailService(mockTransporter);
		});

		it('should send verification email successfully', async () => {
			const email = 'user@example.com';
			const token = 123456;
			mockTransporter.sendMail.mockResolvedValue({} as any);

			await emailService.sendVerificationEmail(email, token);

			expect(htmlTemplate).toHaveBeenCalledWith(token);
			expect(textTemplate).toHaveBeenCalledWith(token);
			expect(mockTransporter.sendMail).toHaveBeenCalledWith({
				from: 'test@example.com',
				to: email,
				subject: 'Email Verification - OTP',
				html: '<html>Mock HTML</html>',
				text: 'Mock Text',
			});
		});

		it('should throw HttpError for invalid email address', async () => {
			const invalidEmail = 'invalid-email';
			const token = 123456;

			await expect(emailService.sendVerificationEmail(invalidEmail, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(invalidEmail, token)).rejects.toThrow('Invalid email format');
		});

		it('should throw HttpError for empty email', async () => {
			const emptyEmail = '';
			const token = 123456;

			await expect(emailService.sendVerificationEmail(emptyEmail, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(emptyEmail, token)).rejects.toThrow('Valid email address is required');
		});

		it('should throw HttpError for null email', async () => {
			const nullEmail = null as any;
			const token = 123456;

			await expect(emailService.sendVerificationEmail(nullEmail, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(nullEmail, token)).rejects.toThrow('Valid email address is required');
		});

		it('should throw HttpError for non-string email', async () => {
			const nonStringEmail = 123 as any;
			const token = 123456;

			await expect(emailService.sendVerificationEmail(nonStringEmail, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(nonStringEmail, token)).rejects.toThrow('Valid email address is required');
		});

		it('should throw HttpError for invalid token (null)', async () => {
			const email = 'user@example.com';
			const invalidToken = null as any;

			await expect(emailService.sendVerificationEmail(email, invalidToken)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(email, invalidToken)).rejects.toThrow('Valid token is required');
		});

		it('should throw HttpError for invalid token (undefined)', async () => {
			const email = 'user@example.com';
			const invalidToken = undefined as any;

			await expect(emailService.sendVerificationEmail(email, invalidToken)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(email, invalidToken)).rejects.toThrow('Valid token is required');
		});

		it('should throw HttpError for invalid token (non-number)', async () => {
			const email = 'user@example.com';
			const invalidToken = 'not-a-number' as any;

			await expect(emailService.sendVerificationEmail(email, invalidToken)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(email, invalidToken)).rejects.toThrow('Valid token is required');
		});

		it('should handle transporter sendMail errors', async () => {
			const email = 'user@example.com';
			const token = 123456;
			const transporterError = new Error('SMTP connection failed');
			mockTransporter.sendMail.mockRejectedValue(transporterError);

			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow('Failed to send verification email: Error: SMTP connection failed');
		});

		it('should preserve HttpError when validation fails', async () => {
			const invalidEmail = 'invalid';
			const token = 123456;

			await expect(emailService.sendVerificationEmail(invalidEmail, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(invalidEmail, token)).rejects.toThrow('Invalid email format');
		});

		it('should handle zero token correctly', async () => {
			const email = 'user@example.com';
			const token = 0;
			mockTransporter.sendMail.mockResolvedValue({} as any);

			await emailService.sendVerificationEmail(email, token);

			expect(htmlTemplate).toHaveBeenCalledWith(token);
			expect(textTemplate).toHaveBeenCalledWith(token);
			expect(mockTransporter.sendMail).toHaveBeenCalled();
		});

		it('should handle negative token correctly', async () => {
			const email = 'user@example.com';
			const token = -123;
			mockTransporter.sendMail.mockResolvedValue({} as any);

			await emailService.sendVerificationEmail(email, token);

			expect(htmlTemplate).toHaveBeenCalledWith(token);
			expect(textTemplate).toHaveBeenCalledWith(token);
			expect(mockTransporter.sendMail).toHaveBeenCalled();
		});

		it('should validate email format with various valid emails', async () => {
			const validEmails = [
				'test@example.com',
				'user.name@example.co.uk',
				'first+last@subdomain.example.org',
			];
			const token = 123456;
			mockTransporter.sendMail.mockResolvedValue({} as any);

			for (const email of validEmails) {
				await emailService.sendVerificationEmail(email, token);
				expect(mockTransporter.sendMail).toHaveBeenCalled();
				jest.clearAllMocks();
			}
		});

		it('should reject invalid email formats', async () => {
			const invalidEmails = [
				'plainaddress',
				'@missingdomain.com',
				'missing@.com',
				'missing@domain',
				'spaces @domain.com',
			];
			const token = 123456;

			for (const email of invalidEmails) {
				await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(HttpError);
				await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow('Invalid email format');
			}
		});
	});

	describe('interface implementation', () => {
		it('should implement IEmailService interface', () => {
			const service: IEmailService = new EmailService(mockTransporter);
			expect(service.sendVerificationEmail).toBeDefined();
			expect(typeof service.sendVerificationEmail).toBe('function');
		});
	});
});