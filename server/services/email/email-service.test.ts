import { EmailService } from './email-service';
import { HttpError } from '../../types/common/error-types';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
	createTransport: jest.fn(() => ({
		sendMail: mockSendMail,
	})),
}));

describe('EmailService', () => {
	let emailService: EmailService;
	const originalEnv = process.env;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env = {
			...originalEnv,
			NODEMAILER_EMAIL: 'test@example.com',
			NODEMAILER_PASSWORD: 'testpassword',
		};
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('constructor', () => {
		it('should create EmailService with valid environment variables', () => {
			expect(() => {
				emailService = new EmailService();
			}).not.toThrow();
		});

		it('should throw HttpError when NODEMAILER_EMAIL is missing', () => {
			delete process.env.NODEMAILER_EMAIL;

			expect(() => {
				new EmailService();
			}).toThrow(HttpError);
			expect(() => {
				new EmailService();
			}).toThrow('Email configuration is missing');
		});

		it('should throw HttpError when NODEMAILER_PASSWORD is missing', () => {
			delete process.env.NODEMAILER_PASSWORD;

			expect(() => {
				new EmailService();
			}).toThrow(HttpError);
			expect(() => {
				new EmailService();
			}).toThrow('Email configuration is missing');
		});

		it('should throw HttpError when both email credentials are missing', () => {
			delete process.env.NODEMAILER_EMAIL;
			delete process.env.NODEMAILER_PASSWORD;

			expect(() => {
				new EmailService();
			}).toThrow(HttpError);
			expect(() => {
				new EmailService();
			}).toThrow('Email configuration is missing');
		});
	});

	describe('sendVerificationEmail', () => {
		beforeEach(() => {
			emailService = new EmailService();
		});

		it('should successfully send verification email', async () => {
			const email = 'user@example.com';
			const token = 123456;
			mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

			await emailService.sendVerificationEmail(email, token);

			expect(mockSendMail).toHaveBeenCalledTimes(1);
			expect(mockSendMail).toHaveBeenCalledWith({
				from: process.env.NODEMAILER_EMAIL,
				to: email,
				subject: 'Email Verification - OTP',
				html: expect.any(String),
				text: expect.any(String),
			});
		});

		it('should throw HttpError when email sending fails', async () => {
			const email = 'user@example.com';
			const token = 123456;
			const sendError = new Error('SMTP connection failed');
			mockSendMail.mockRejectedValue(sendError);

			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(
				'Failed to send verification email'
			);
		});

		it('should handle network timeout errors', async () => {
			const email = 'user@example.com';
			const token = 123456;
			const timeoutError = new Error('Connection timeout');
			mockSendMail.mockRejectedValue(timeoutError);

			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(
				'Failed to send verification email'
			);
		});

		it('should handle invalid email address errors', async () => {
			const email = 'invalid-email';
			const token = 123456;
			const invalidEmailError = new Error('Invalid email address');
			mockSendMail.mockRejectedValue(invalidEmailError);

			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(
				'Failed to send verification email'
			);
		});

		it('should handle authentication errors', async () => {
			const email = 'user@example.com';
			const token = 123456;
			const authError = new Error('Authentication failed');
			mockSendMail.mockRejectedValue(authError);

			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(HttpError);
			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(
				'Failed to send verification email'
			);
		});

		it('should send email with correct token in content', async () => {
			const email = 'user@example.com';
			const token = 456789;
			mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

			await emailService.sendVerificationEmail(email, token);

			expect(mockSendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					html: expect.stringContaining(token.toString()),
					text: expect.stringContaining(token.toString()),
				})
			);
		});

		it('should use environment email as sender', async () => {
			const email = 'user@example.com';
			const token = 123456;
			mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

			await emailService.sendVerificationEmail(email, token);

			expect(mockSendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					from: process.env.NODEMAILER_EMAIL,
				})
			);
		});
	});

	describe('edge cases', () => {
		beforeEach(() => {
			emailService = new EmailService();
		});

		it('should handle empty email address', async () => {
			const email = '';
			const token = 123456;
			const emptyEmailError = new Error('No recipients defined');
			mockSendMail.mockRejectedValue(emptyEmailError);

			await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow(HttpError);
		});

		it('should handle zero token', async () => {
			const email = 'user@example.com';
			const token = 0;
			mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

			await emailService.sendVerificationEmail(email, token);

			expect(mockSendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					html: expect.stringContaining('0'),
					text: expect.stringContaining('0'),
				})
			);
		});

		it('should handle large token numbers', async () => {
			const email = 'user@example.com';
			const token = 999999;
			mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

			await emailService.sendVerificationEmail(email, token);

			expect(mockSendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					html: expect.stringContaining('999999'),
					text: expect.stringContaining('999999'),
				})
			);
		});
	});
});