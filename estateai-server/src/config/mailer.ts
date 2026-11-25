import nodemailer from 'nodemailer';
import { env } from './env.js';
import { logger } from './logger.js';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: env.SMTP_USER && env.SMTP_PASSWORD ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    })
  : null;

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  devLink?: string;
}): Promise<void> {
  if (!transporter) {
    if (env.NODE_ENV !== 'production') {
      logger.info({ to: options.to, subject: options.subject, link: options.devLink }, 'Email preview');
    }
    return;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
