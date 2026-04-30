/**
 * Shared email-template helpers — Spirala visual identity.
 *
 * Every transactional email in the backend (contact form, booking
 * confirmations, reschedule notifications, future newsletter blasts, …)
 * should render its body inside `wrapWithSpiralaLayout()` so brand
 * changes (logo, palette, footer) only need to happen in one place.
 *
 * All styles are inlined — most email clients (Gmail web, Outlook
 * desktop) strip <style> blocks and refuse external stylesheets.
 * The outer layout uses table-based positioning for Outlook quirks.
 */

const SPIRALA_LOGO_URL =
  'https://spira-la.com/assets/spirala-icon-CDnDfb7j.png';

const SPIRALA_SITE_URL = 'https://spira-la.com';
const SPIRALA_CONTACT_EMAIL = 'contact@spira-la.com';

/** HTML-escapes text so it is safe to interpolate into template strings. */
export function escapeHtml(raw: string): string {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Renders a label / value row inside a Spirala-styled details table. */
export function kvRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E8E4DF; font-family: 'Lato', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #8A8A8A; font-weight: 600; width: 140px; vertical-align: top;">${label}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E8E4DF; font-family: 'Lato', Arial, sans-serif; font-size: 15px; color: #2D2D2D;">${value}</td>
    </tr>
  `;
}

export interface SpiralaLayoutOptions {
  /** Hidden preview text shown in the email client preview. */
  preheader: string;
  /** Big serif title at the top of the body. */
  title: string;
  /** Small uppercase tracked text in the gold header, under "Spirala". */
  subtitle: string;
  /** Pre-rendered, escaped HTML for the body section. */
  body: string;
}

/**
 * Wraps a body fragment in the Spirala-branded shell:
 *   - Gold gradient header with logo + brand name + subtitle
 *   - Cream body with a serif title and a thin gold accent bar
 *   - Cream-dark footer with site/email links
 *
 * Returns a full <!DOCTYPE html> document — pass directly to nodemailer.
 */
export function wrapWithSpiralaLayout(opts: SpiralaLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: 'Lato', Arial, sans-serif;">
  <span style="display: none; font-size: 0; line-height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; visibility: hidden;">
    ${escapeHtml(opts.preheader)}
  </span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9F6F0;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
          <!-- Header (logo + brand) -->
          <tr>
            <td style="background: linear-gradient(135deg, #B8963E 0%, #D4B96A 100%); padding: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="56" style="vertical-align: middle; padding-right: 16px;">
                    <img src="${SPIRALA_LOGO_URL}" alt="Spirala" width="48" height="48" style="display: block; width: 48px; height: 48px; border: 0; outline: none;">
                  </td>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.04em; line-height: 1;">
                      Spirala
                    </p>
                    <p style="margin: 4px 0 0; font-family: 'Lato', Arial, sans-serif; font-size: 13px; color: rgba(255,255,255,0.92); letter-spacing: 0.04em; text-transform: uppercase;">
                      ${escapeHtml(opts.subtitle)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="padding: 32px 32px 0; background: #F9F6F0;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 700; color: #2D2D2D; line-height: 1.2;">
                ${escapeHtml(opts.title)}
              </h1>
              <div style="width: 40px; height: 2px; background: #B8963E; margin: 16px 0 24px;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 0 32px 32px; background: #F9F6F0;">
              ${opts.body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #EDE8DC; border-top: 1px solid #E8E4DF;">
              <p style="margin: 0 0 4px; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; font-weight: 700; color: #2D2D2D;">
                Spirala
              </p>
              <p style="margin: 0 0 8px; font-family: 'Lato', Arial, sans-serif; font-size: 12px; color: #6B6B6B; line-height: 1.6;">
                Coaching i terapia online — Aneta Mroczko
              </p>
              <p style="margin: 0; font-family: 'Lato', Arial, sans-serif; font-size: 12px; color: #8A8A8A;">
                <a href="${SPIRALA_SITE_URL}" style="color: #B8963E; text-decoration: none;">spira-la.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:${SPIRALA_CONTACT_EMAIL}" style="color: #B8963E; text-decoration: none;">${SPIRALA_CONTACT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
