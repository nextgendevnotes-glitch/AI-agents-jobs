import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

export class EmailService {
  /**
   * Creates a SMTP transporter using the USER's own email credentials if provided,
   * otherwise falls back to the platform SMTP account.
   * This ensures the email arrives in the company's inbox as coming FROM the user.
   */
  private static createTransporter(userEmail?: string, userPassword?: string) {
    const smtpEmail = userEmail || ENV.SMTP_USER;
    const smtpPass  = userPassword || ENV.SMTP_PASS;
    const smtpHost  = ENV.SMTP_HOST || 'smtp.gmail.com';

    return nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false,
      auth: { user: smtpEmail, pass: smtpPass },
    });
  }

  static async sendApplicationEmail(
    to: string,
    subject: string,
    body: string,
    applicantName?: string,
    applicantEmail?: string,
    applicantSmtpPassword?: string,   // user's Gmail App Password
    resumeBuffer?: Buffer,
  ): Promise<boolean> {
    // Determine which account we're sending from
    const fromEmail = (applicantEmail && applicantSmtpPassword) ? applicantEmail : ENV.SMTP_USER;
    const fromPass  = (applicantEmail && applicantSmtpPassword) ? applicantSmtpPassword : ENV.SMTP_PASS;

    if (!fromEmail || !fromPass) {
      console.warn('No SMTP credentials available. Logging email instead.');
      console.log(`To: ${to}\nSubject: ${subject}\nBody:\n${body}`);
      return true;
    }

    const transporter = this.createTransporter(fromEmail, fromPass);

    const fromHeader = applicantName
      ? `"${applicantName}" <${fromEmail}>`
      : fromEmail;

    const mailOptions: any = {
      from: fromHeader,
      to,
      subject,
      text: body,
      html: body
        .split('\n\n')
        .map(para => `<p style="margin: 0 0 16px 0; line-height: 1.7; color: #1f2937;">${para.replace(/\n/g, '<br/>')}</p>`)
        .join(''),
    };

    if (resumeBuffer) {
      mailOptions.attachments = [{ filename: 'resume.pdf', content: resumeBuffer }];
    }

    const MAX_RETRIES = 3;
    const DELAY_MS = 4000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent from ${fromEmail} to ${to} | ID: ${info.messageId}`);
        return true;
      } catch (error) {
        console.error(`Email attempt ${attempt}/${MAX_RETRIES} failed:`, error);
        if (attempt === MAX_RETRIES) throw error;
      }
    }

    return false;
  }
}
