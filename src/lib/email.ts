/**
 * Transactional email sender. When SMTP is not configured (e.g. local dev),
 * emails are logged to the console instead of failing the request — this keeps
 * the verification/reset flows fully functional without requiring a mail provider.
 */
interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const host = process.env.SMTP_HOST;

  if (!host) {
    console.info(`[email:dev] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }

  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

export function verificationEmailHtml(name: string, verifyUrl: string): string {
  return `<p>Hi ${name},</p><p>Confirm your email to activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
}

export function passwordResetEmailHtml(name: string, resetUrl: string): string {
  return `<p>Hi ${name},</p><p>Reset your password using the link below. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;
}
