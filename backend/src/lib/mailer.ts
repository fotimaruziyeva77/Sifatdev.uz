import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config.js";

export type EmailPayload = { to: string; subject: string; text: string; replyTo?: string };

let transport: Transporter | null = null;

export function mailEnabled(): boolean {
  return Boolean(config.SMTP_HOST);
}

function getTransport(): Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      requireTLS: config.SMTP_PORT !== 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
      tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
      // Fayl/URL o'qishni butunlay o'chiramiz — xat faqat oddiy matndan iborat.
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }
  return transport;
}

/** Faqat matnli xat (HTML yo'q) — XSS/phishing yuzasi kamayadi. */
export async function sendEmail(p: EmailPayload): Promise<void> {
  if (!mailEnabled()) throw new Error("smtp_not_configured");
  await getTransport().sendMail({
    from: config.SMTP_FROM,
    to: p.to,
    subject: p.subject.replace(/[\r\n]+/g, " ").slice(0, 200),
    text: p.text,
    replyTo: p.replyTo,
  });
}
