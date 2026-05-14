import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface UnifiedEmailContentInput {
  headline: string;
  messageLines: string[];
  actionLabel?: string;
  actionUrl?: string;
  footerLines?: string[];
  previewText?: string;
}

const APP_NAME = "Transxact Projects";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeLines(lines: string[] | undefined): string[] {
  if (!lines) {
    return [];
  }

  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function createUnifiedEmailContent(
  input: UnifiedEmailContentInput,
): { text: string; html: string } {
  const messageLines = normalizeLines(input.messageLines);
  const footerLines = normalizeLines(input.footerLines);
  const safeHeadline = escapeHtml(input.headline.trim());
  const safePreviewText = escapeHtml(input.previewText ?? input.headline);
  const hasAction = Boolean(input.actionLabel && input.actionUrl);

  const textLines = [
    input.headline.trim(),
    "",
    ...messageLines,
    hasAction ? "" : null,
    hasAction ? `${input.actionLabel}: ${input.actionUrl}` : null,
    footerLines.length > 0 ? "" : null,
    ...footerLines,
  ].filter((line): line is string => typeof line === "string" && line.length > 0);

  const messageHtml = messageLines
    .map(
      (line) =>
        `<p style="margin:0 0 14px;color:#1f2937;font-size:15px;line-height:1.6;">${escapeHtml(line)}</p>`,
    )
    .join("");
  const actionHtml = hasAction
    ? `<tr><td style="padding:10px 0 18px;"><a href="${escapeHtml(input.actionUrl ?? "")}" style="display:inline-block;padding:12px 18px;background:#2563eb;border-radius:6px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">${escapeHtml(input.actionLabel ?? "Open")}</a></td></tr>`
    : "";
  const footerHtml =
    footerLines.length > 0
      ? `<tr><td style="padding-top:8px;border-top:1px solid #e5e7eb;">${footerLines
          .map(
            (line) =>
              `<p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(line)}</p>`,
          )
          .join("")}</td></tr>`
      : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeHeadline}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${safePreviewText}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;">
      <tr>
        <td style="padding:22px 24px;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${APP_NAME}</p>
          <h1 style="margin:10px 0 0;color:#111827;font-size:22px;line-height:1.3;">${safeHeadline}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          ${messageHtml}
          ${actionHtml}
          ${footerHtml}
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    text: textLines.join("\n"),
    html,
  };
}

export async function sendEmail(options: EmailOptions) {
  try {
    await transport.sendMail({
      from: `Transxact Projects <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error(`Failed to send email to ${options.to}:`, error);
    throw error;
  }
}
