import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Guarda Dinheiro <noreply@guardadinheiro.com.br>";

type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  react: ReactElement;
  idempotencyKey?: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping email to", opts.to);
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [opts.to],
      subject: opts.subject,
      react: opts.react,
      tags: opts.tags,
      headers: opts.idempotencyKey
        ? { "X-Entity-Ref-ID": opts.idempotencyKey }
        : undefined,
    });

    if (error) {
      Sentry.captureException(new Error(error.message), {
        tags: { component: "email" },
        extra: { to: opts.to, subject: opts.subject },
      });
      console.error("[email] Resend error:", error.message);
      return { ok: false, error: error.message };
    }

    console.log("[email] Sent to=%s subject=%s id=%s", opts.to, opts.subject, data?.id);
    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: "email" },
      extra: { to: opts.to, subject: opts.subject },
    });
    console.error("[email] Unexpected error:", err);
    return { ok: false, error: "Unexpected email error" };
  }
}
