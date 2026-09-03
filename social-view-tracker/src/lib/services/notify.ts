import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

type EmailResult = { delivered: boolean; error: string | null };

/**
 * Sends an alert email through the configured SMTP server. When SMTP is not
 * configured the attempt is recorded as undelivered with a clear reason.
 */
export async function sendEmailNotification(opts: {
  userId: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<EmailResult> {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { email: true, name: true },
  });
  const to = user?.email;
  if (!to) return { delivered: false, error: "User has no email on file." };

  const host = process.env.SMTP_HOST;
  if (!host) {
    return {
      delivered: false,
      error: "SMTP not configured (set SMTP_HOST). Notification recorded, not sent.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
        : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Social View Tracker <no-reply@example.com>",
      to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { delivered: true, error: null };
  } catch (err) {
    return { delivered: false, error: `SMTP error: ${(err as Error).message}` };
  }
}