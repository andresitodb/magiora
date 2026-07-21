// Email lib — sends transactional emails via Resend, logs to email_log.
//
// Environment variables required:
//   RESEND_API_KEY        — from resend.com
//   EMAIL_FROM            — e.g. "Magiora <hello@magiora.com>"
//   NEXT_PUBLIC_SITE_URL  — for links inside emails
//
// If RESEND_API_KEY is missing, emails are logged but skipped (dev mode).

import { createServiceClient } from '@/lib/supabase/service';
import { inspectEmailConfig } from '@/lib/emailConfig';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

interface SendOptions {
  to: string;
  template:
    | 'welcome'
    | 'interview_invited'
    | 'application_status'
    | 'casting_match'
    | 'newsletter_welcome'
    | 'password_reset';
  subject: string;
  html: string;
  text?: string;
  relatedId?: string | null;
}

export async function sendEmail(opts: SendOptions): Promise<{ status: 'sent' | 'skipped' | 'failed'; error?: string }> {
  const supabase = createServiceClient();

  // Check dedupe — if same template+relatedId+email already exists, skip
  const dedupeKey = `${opts.template}::${opts.relatedId ?? ''}::${opts.to.toLowerCase()}`;
  const { data: existing } = await supabase
    .from('email_log')
    .select('id, status')
    .eq('dedupe_key', dedupeKey)
    .maybeSingle();

  if (existing && existing.status === 'sent') {
    return { status: 'skipped', error: 'Already sent (dedupe)' };
  }

  const emailConfig = inspectEmailConfig(
    process.env.RESEND_API_KEY,
    process.env.EMAIL_FROM,
    process.env.NEXT_PUBLIC_SITE_URL
  );

  if (emailConfig.status !== 'enabled') {
    const reason =
      emailConfig.status === 'disabled'
        ? 'RESEND_API_KEY not configured'
        : `Email configuration invalid: ${emailConfig.issues.join('; ')}`;
    await supabase.from('email_log').insert({
      to_email: opts.to,
      template: opts.template,
      subject: opts.subject,
      related_id: opts.relatedId ?? null,
      status: 'skipped',
      error: reason,
      dedupe_key: dedupeKey,
    });
    console.warn(`[email] SKIPPED ${opts.template} (configuration unavailable)`);
    return { status: 'skipped', error: reason };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emailConfig.apiKey}`,
      },
      body: JSON.stringify({
        from: emailConfig.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text ?? stripHtml(opts.html),
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      await supabase.from('email_log').insert({
        to_email: opts.to,
        template: opts.template,
        subject: opts.subject,
        related_id: opts.relatedId ?? null,
        status: 'failed',
        error: errorBody.slice(0, 500),
        dedupe_key: dedupeKey,
      });
      console.error(`[email] FAILED ${opts.template}`, { status: res.status });
      return { status: 'failed', error: errorBody };
    }

    await supabase.from('email_log').insert({
      to_email: opts.to,
      template: opts.template,
      subject: opts.subject,
      related_id: opts.relatedId ?? null,
      status: 'sent',
      sent_at: new Date().toISOString(),
      dedupe_key: dedupeKey,
    });
    return { status: 'sent' };
  } catch (err: unknown) {
    await supabase.from('email_log').insert({
      to_email: opts.to,
      template: opts.template,
      subject: opts.subject,
      related_id: opts.relatedId ?? null,
      status: 'failed',
      error: String(err).slice(0, 500),
      dedupe_key: dedupeKey,
    });
    return { status: 'failed', error: String(err) };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

const baseStyles = `
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f5f3ee; color: #292524; }
    .wrap { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 32px; }
    h1 { font-family: Georgia, serif; font-size: 28px; font-weight: 500; margin: 0 0 8px; color: #1c1917; }
    .kicker { font-style: italic; font-size: 13px; color: #993C1D; margin-bottom: 8px; letter-spacing: 0.05em; text-transform: uppercase; }
    p { font-size: 16px; line-height: 1.6; color: #44403c; margin: 16px 0; }
    .button { display: inline-block; background: #712B13; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-family: 'Helvetica Neue', sans-serif; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e7e5e4; font-size: 13px; color: #78716c; font-style: italic; text-align: center; }
    .footer a { color: #712B13; }
  </style>
`;

export function welcomeEmail(displayName: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to Magiora',
    html: `
      ${baseStyles}
      <body>
        <div class="wrap">
          <p class="kicker">Welcome to the community</p>
          <h1>Hello, ${escapeHtml(displayName.split(' ')[0])}</h1>
          <p>You've joined Magiora — a small, growing community of independent filmmakers, actors, and crew building work outside the studio system.</p>
          <p>Three quick things to do next:</p>
          <p>
            1. <strong>Complete your profile.</strong> Add a bio, headshot, and your roles so producers can find you.<br>
            2. <strong>Browse the directory</strong> to see who else is working in your area.<br>
            3. <strong>Check open casting calls</strong> — you can apply to anything that fits.
          </p>
          <p style="text-align: center;">
            <a class="button" href="${SITE_URL}/dashboard/profile">Complete your profile →</a>
          </p>
          <div class="footer">
            <p>Magiora — where ideas become productions.<br>
            <a href="${SITE_URL}">${SITE_URL.replace(/^https?:\/\//, '')}</a></p>
          </div>
        </div>
      </body>
    `,
  };
}

export function interviewInvitedEmail(
  displayName: string,
  workingTitle: string,
  interviewId: string
): { subject: string; html: string } {
  return {
    subject: "You've been selected for an interview",
    html: `
      ${baseStyles}
      <body>
        <div class="wrap">
          <p class="kicker">You've been invited</p>
          <h1>${escapeHtml(displayName.split(' ')[0])}, want to be featured?</h1>
          <p>The Magiora editor has selected you for an upcoming story. The working title:</p>
          <p style="font-style: italic; font-size: 18px; color: #712B13; border-left: 3px solid #712B13; padding-left: 16px;">${escapeHtml(workingTitle)}</p>
          <p>The interview is a written Q&amp;A. We've seeded a few questions to get you started — you can add, edit, or remove anything. Take your time, save as you go, and submit when you're happy with it.</p>
          <p>We edit lightly for clarity before publishing.</p>
          <p style="text-align: center;">
            <a class="button" href="${SITE_URL}/dashboard/stories/${interviewId}/answer">Start the interview →</a>
          </p>
          <div class="footer">
            <p>If you'd rather pass, no problem — just ignore this email.<br>
            <a href="${SITE_URL}">Magiora</a></p>
          </div>
        </div>
      </body>
    `,
  };
}

export function applicationStatusEmail(
  displayName: string,
  projectTitle: string,
  roleName: string,
  newStatus: string,
  callId: string
): { subject: string; html: string } {
  const statusMessages: Record<string, { headline: string; body: string }> = {
    viewed: {
      headline: 'Your application was viewed',
      body: `The producer of <strong>${escapeHtml(projectTitle)}</strong> has reviewed your application for <em>${escapeHtml(roleName)}</em>.`,
    },
    shortlisted: {
      headline: "You're on the short list",
      body: `Great news — you've been shortlisted for <em>${escapeHtml(roleName)}</em> in <strong>${escapeHtml(projectTitle)}</strong>. The producer may reach out for a callback.`,
    },
    cast: {
      headline: 'You got the part',
      body: `Congratulations — you've been cast as <em>${escapeHtml(roleName)}</em> in <strong>${escapeHtml(projectTitle)}</strong>. The producer will contact you with next steps.`,
    },
    rejected: {
      headline: 'A casting decision was made',
      body: `The producer of <strong>${escapeHtml(projectTitle)}</strong> has moved forward with other candidates for <em>${escapeHtml(roleName)}</em>. Keep applying — the right project is out there.`,
    },
  };

  const m = statusMessages[newStatus] ?? statusMessages.viewed;

  return {
    subject: m.headline,
    html: `
      ${baseStyles}
      <body>
        <div class="wrap">
          <p class="kicker">Application update</p>
          <h1>${m.headline}</h1>
          <p>Hi ${escapeHtml(displayName.split(' ')[0])},</p>
          <p>${m.body}</p>
          <p style="text-align: center;">
            <a class="button" href="${SITE_URL}/casting-calls/${callId}">View the call →</a>
          </p>
          <p style="text-align: center; font-size: 14px;">
            <a href="${SITE_URL}/dashboard/applications" style="color: #712B13;">See all your applications</a>
          </p>
          <div class="footer">
            <p><a href="${SITE_URL}">Magiora</a></p>
          </div>
        </div>
      </body>
    `,
  };
}

export function castingMatchEmail(
  displayName: string,
  callTitle: string,
  roleName: string,
  reasons: string[],
  callId: string
): { subject: string; html: string } {
  const reasonsHtml = reasons
    .slice(0, 4)
    .map((r) => `<li style="margin: 4px 0;">${escapeHtml(r)}</li>`)
    .join('');

  return {
    subject: `A casting call matches your profile: ${callTitle}`,
    html: `
      ${baseStyles}
      <body>
        <div class="wrap">
          <p class="kicker">We found a match</p>
          <h1>You'd be a great fit for this role</h1>
          <p>Hi ${escapeHtml(displayName.split(' ')[0])},</p>
          <p>A new casting call just opened and it lines up with your profile:</p>
          <p style="font-size: 18px; color: #712B13; border-left: 3px solid #712B13; padding-left: 16px;">
            <strong>${escapeHtml(callTitle)}</strong><br>
            <em>${escapeHtml(roleName)}</em>
          </p>
          ${
            reasons.length > 0
              ? `<p>Why we thought of you:</p><ul style="font-style: italic; color: #57534e;">${reasonsHtml}</ul>`
              : ''
          }
          <p style="text-align: center;">
            <a class="button" href="${SITE_URL}/casting-calls/${callId}">See the call →</a>
          </p>
          <div class="footer">
            <p>You're receiving this because your profile matched the role criteria.<br>
            <a href="${SITE_URL}/dashboard">Manage notifications</a> · <a href="${SITE_URL}">Magiora</a></p>
          </div>
        </div>
      </body>
    `,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
