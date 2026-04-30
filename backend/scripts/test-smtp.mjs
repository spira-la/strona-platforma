#!/usr/bin/env node
/**
 * SMTP smoke test for Spirala backend.
 *
 * Reads SMTP_* and CONTACT_NOTIFICATION_EMAIL from the same env file the
 * NestJS app uses, then runs three increasingly aggressive checks so you
 * can pinpoint exactly where the email pipeline breaks:
 *
 *   1) DNS resolution of SMTP_HOST.
 *   2) Raw TCP connect to SMTP_HOST:SMTP_PORT (proves the egress firewall
 *      and host are reachable — independent of TLS/auth).
 *   3) nodemailer verify() — opens a real SMTP session, negotiates TLS,
 *      authenticates with SMTP_USER / SMTP_PASS.
 *   4) Sends a tiny test email to CONTACT_NOTIFICATION_EMAIL (or a
 *      --to=... override) so you confirm the inbox actually receives it.
 *
 * Usage on server:
 *   cd ~/Dev/strona-platforma/backend
 *   docker compose -f docker-compose.dev.yml exec spirala-be-dev \
 *     node scripts/test-smtp.mjs --to=youremail@example.com
 *
 * Or outside the container with a local .env:
 *   node --env-file=.env.development scripts/test-smtp.mjs
 *
 * Exit codes:
 *   0 = everything green   1 = step failed (logs which one)
 */
import { promises as dns } from 'node:dns';
import net from 'node:net';
import process from 'node:process';

const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT ?? 465);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL ?? USER;
const FROM_NAME = process.env.SMTP_FROM_NAME ?? 'Spirala';
const NOTIFICATION_EMAIL =
  process.env.CONTACT_NOTIFICATION_EMAIL ?? 'contact@spira-la.com';

const argTo = process.argv
  .find((a) => a.startsWith('--to='))
  ?.slice('--to='.length);
const TO = argTo ?? NOTIFICATION_EMAIL;

const passMasked = PASS ? `${PASS.slice(0, 2)}•••${PASS.slice(-2)}` : '<empty>';

console.log('━'.repeat(60));
console.log('  Spirala SMTP smoke test');
console.log('━'.repeat(60));
console.log(`  SMTP_HOST                  : ${HOST ?? '<empty>'}`);
console.log(`  SMTP_PORT                  : ${PORT}`);
console.log(`  SMTP_USER                  : ${USER ?? '<empty>'}`);
console.log(`  SMTP_PASS                  : ${passMasked}`);
console.log(`  SMTP_FROM_EMAIL            : ${FROM_EMAIL ?? '<empty>'}`);
console.log(`  CONTACT_NOTIFICATION_EMAIL : ${NOTIFICATION_EMAIL}`);
console.log(`  Sending test email to      : ${TO}`);
console.log('━'.repeat(60));

if (!HOST || !USER || !PASS) {
  console.error('✗ Missing SMTP_HOST / SMTP_USER / SMTP_PASS in env.');
  process.exit(1);
}

// 1) DNS
try {
  const ips = await dns.lookup(HOST, { all: true });
  console.log(`✓ DNS  ${HOST} → ${ips.map((i) => i.address).join(', ')}`);
} catch (err) {
  console.error(`✗ DNS  ${HOST} could not be resolved:`, err.message);
  process.exit(1);
}

// 2) Raw TCP
await new Promise((resolve) => {
  const socket = net.createConnection({ host: HOST, port: PORT });
  const timer = setTimeout(() => {
    socket.destroy();
    console.error(
      `✗ TCP  cannot reach ${HOST}:${PORT} — timed out after 7s`,
    );
    console.error(
      `       Most likely the host firewall (Hetzner / iptables) is`,
    );
    console.error(`       blocking outbound to port ${PORT}.`);
    process.exit(1);
  }, 7000);
  socket.once('connect', () => {
    clearTimeout(timer);
    console.log(`✓ TCP  connected to ${HOST}:${PORT}`);
    socket.end();
    resolve();
  });
  socket.once('error', (err) => {
    clearTimeout(timer);
    console.error(`✗ TCP  ${HOST}:${PORT} error: ${err.message}`);
    process.exit(1);
  });
});

// 3) + 4) nodemailer verify + send
let nodemailer;
try {
  nodemailer = await import('nodemailer');
} catch {
  console.error(
    '✗ nodemailer not installed — run inside the backend container or `npm i nodemailer`',
  );
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: HOST,
  port: PORT,
  secure: PORT === 465,
  auth: { user: USER, pass: PASS },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

try {
  await transporter.verify();
  console.log('✓ SMTP verify() — TLS + auth OK');
} catch (err) {
  console.error('✗ SMTP verify() failed:', err.message);
  if (err.code) console.error('       code     :', err.code);
  if (err.response) console.error('       response :', err.response);
  process.exit(1);
}

try {
  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: TO,
    subject: '[Spirala] SMTP smoke test',
    text: 'If you can read this, the SMTP pipeline works end to end.',
    html: '<p>If you can read this, the <strong>SMTP pipeline works end to end</strong>.</p>',
  });
  console.log(`✓ SEND messageId=${info.messageId}`);
  console.log(`       envelope: ${JSON.stringify(info.envelope)}`);
  console.log(`       accepted: ${JSON.stringify(info.accepted)}`);
  console.log(`       rejected: ${JSON.stringify(info.rejected)}`);
} catch (err) {
  console.error('✗ SEND failed:', err.message);
  if (err.code) console.error('       code     :', err.code);
  if (err.response) console.error('       response :', err.response);
  process.exit(1);
}

console.log('━'.repeat(60));
console.log('  ALL CHECKS PASSED — check inbox of ' + TO);
console.log('━'.repeat(60));
