import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(payload)
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST to send an email.' });
  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'The request was not valid JSON.' }); }

  const to = String(data.to || '').trim();
  const subject = String(data.subject || 'National Way Delivery Logistics — Shipment update').trim().slice(0, 180);
  const tracking = String(data.tracking || '').trim().slice(0, 100);
  const senderName = String(data.senderName || 'Not provided').trim().slice(0, 160) || 'Not provided';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(to)) return json(400, { error: 'Enter a valid recipient email address.' });
  if (!tracking) return json(400, { error: 'A tracking code is required.' });

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return json(500, { error: 'Gmail sending is not configured. Check GMAIL_USER and GMAIL_APP_PASSWORD in Netlify environment variables, then redeploy.' });

  // All fixed text in the customer-facing email comes from this dictionary.
  // The admin email composer translates it before sending; English is the safe fallback.
  const defaults = {
    company: 'National Way Delivery Logistics', customer: 'Customer', heading: 'Shipment Delivery Update',
    tagline: 'Customer Delivery Notice', greeting: 'Hello',
    intro: 'Here is the latest information for your shipment.',
    trackingHeading: 'YOUR TRACKING CODE',
    copyHint: 'Use the button below to copy your tracking code.',
    copyButton: 'COPY TRACKING CODE', trackingButton: 'OPEN TRACKING PAGE',
    detailsHeading: 'Shipment details', senderName: 'Sender name',
    customerPhone: 'Customer phone number', status: 'Current status',
    location: 'Current location', destination: 'Destination',
    expected: 'Expected delivery', reason: 'Reason / note',
    trackLink: 'Track your shipment', closing: 'Kind regards,',
    service: 'Shipment service', messageHeading: 'Message from National Way Delivery Logistics',
    footer: 'Safe • Reliable • On Time', customerPhoto: 'Customer picture',
    luggagePhoto: 'Luggage / parcel picture', noValue: 'To be confirmed'
  };
  const incomingUi = data.emailUi && typeof data.emailUi === 'object' ? data.emailUi : {};
  const ui = Object.fromEntries(Object.keys(defaults).map(key => [key, String(incomingUi[key] || defaults[key]).slice(0, 500)]));
  const language = String(incomingUi.language || 'en').slice(0, 20);
  const direction = incomingUi.direction === 'rtl' ? 'rtl' : 'ltr';
  const translatedFields = incomingUi.fields && typeof incomingUi.fields === 'object' ? incomingUi.fields : {};

  const fields = [
    [ui.senderName, senderName],
    [ui.customerPhone, data.customerPhone || ui.noValue],
    [ui.status, translatedFields.status || data.status || ui.noValue],
    [ui.location, translatedFields.location || data.location || ui.noValue],
    [ui.destination, translatedFields.destination || data.destination || ui.noValue],
    [ui.expected, translatedFields.expectedDate || data.expectedDate || ui.noValue]
  ];
  if (data.reason) fields.push([ui.reason, translatedFields.reason || data.reason]);
  const details = fields.map(([label, value]) => `<tr><td style="padding:10px 12px;color:#50627b;border-bottom:1px solid #e5ebf3;width:42%">${escapeHtml(label)}</td><td style="padding:10px 12px;color:#122642;font-weight:600;border-bottom:1px solid #e5ebf3">${escapeHtml(value || ui.noValue)}</td></tr>`).join('');
  const siteUrl = String(data.siteUrl || process.env.URL || 'https://snazzy-kringle-c8de52.netlify.app').replace(/\/$/, '');
  const trackingUrl = String(data.trackingUrl || `${siteUrl}/#home`);
  const message = String(data.message || '').slice(0, 12000);
  // Images are accepted only as compressed inline data URLs supplied by the
  // admin form. They are attached with per-message CID identifiers; no external
  // image host or new credential is required.
  const attachments = [];
  const imageBlockParts = [];
  // Inline National Way airline-style wordmark so the logo displays in customer inboxes without external hosting.
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const emailLogo = await readFile(resolve(here, '../../public/nw-email-logo.png'));
    attachments.push({ filename: 'national-way-logistics-airline-logo.png', content: emailLogo, contentType: 'image/png', cid: 'national-way-airline-logo' });
  } catch (error) { /* Keep email delivery working if the optional logo file is missing. */ }
  // Embed National Way's own branded transport banner so the email does not
  // depend on an external image host. Keep it separate from customer photos.
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const banner = await readFile(resolve(here, '../../public/nw-cargo-aircraft.jpg'));
    attachments.push({ filename: 'national-way-logistics-aircraft-banner.jpg', content: banner, contentType: 'image/jpeg', cid: 'national-way-brand-banner' });
  } catch (error) {
    // The email remains deliverable if the optional brand image is unavailable.
  }

  const addInlineImage = (value, cid, label, style, showInBody = true) => {
    const match = typeof value === 'string' && value.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\r\n]+)$/i);
    if (!match) return false;
    let content;
    try { content = Buffer.from(match[2].replace(/\s+/g, ''), 'base64'); } catch { return false; }
    if (!content.length || content.length > 3 * 1024 * 1024) return false;
    const ext = match[1].toLowerCase().replace('jpeg', 'jpg');
    attachments.push({ filename: `${cid}.${ext}`, content, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, cid });
    if (showInBody) imageBlockParts.push(`<div style="display:inline-block;vertical-align:top;text-align:center;margin:8px 10px 12px;max-width:100%"><img src="cid:${cid}" alt="${label}" style="${style}"><div style="font-size:12px;color:#50627b;margin-top:6px">${label}</div></div>`);
    return true;
  };
  // Keep the customer's photo beside the company logo in the email header.
  // It is attached inline with a CID so it appears in the recipient's email
  // without depending on an external image-hosting service.
  const hasCustomerPortrait = addInlineImage(data.customerPhoto, 'National Way-customer-photo', escapeHtml(ui.customerPhoto), 'width:82px;height:82px;object-fit:cover;border-radius:12px;border:2px solid #ffffff;display:block', false);
  // The luggage picture, if supplied, remains in the email body as a separate image.
  addInlineImage(data.photo, 'National Way-shipment-photo', escapeHtml(ui.luggagePhoto), 'width:180px;max-width:100%;height:120px;max-height:150px;object-fit:contain;border-radius:10px;border:1px solid #dce5f0;background:#ffffff;display:block');
  const imageBlock = imageBlockParts.length ? `<div style="text-align:center;margin:16px 0 22px;padding:10px;background:#f8fafc;border:1px solid #e5ebf3;border-radius:12px">${imageBlockParts.join('')}</div>` : '';
  const html = `<!doctype html><html lang="${escapeHtml(language)}" dir="${direction}"><body style="margin:0;padding:24px 10px;background:#f2f5fa;font-family:Arial,Helvetica,sans-serif;color:#172b49"><div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden"><div style="padding:26px 24px;background:#071d39;color:#fff;text-align:center"><div style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap"><div style="display:flex;align-items:center;justify-content:center;vertical-align:middle"><img src="cid:national-way-airline-logo" alt="National Way Logistics airline-style company logo" style="display:block;width:100%;max-width:500px;height:auto;border:0;border-radius:10px"></div>${hasCustomerPortrait ? '<img src="cid:National Way-customer-photo" alt="'+escapeHtml(ui.customerPhoto)+'" style="width:82px;height:82px;object-fit:cover;border:2px solid #fff;border-radius:12px;display:block">' : ''}</div><img src="cid:national-way-brand-banner" alt="National Way Delivery Logistics aircraft and road transport" style="display:block;width:100%;max-width:560px;height:auto;max-height:170px;object-fit:cover;border-radius:12px;margin:16px auto 0;border:1px solid rgba(255,255,255,.3)"><h1 style="font-size:23px;line-height:1.3;margin:18px 0 6px;color:#fff">${escapeHtml(ui.heading)}</h1><p style="margin:0;color:#d8e6fb">${escapeHtml(ui.tagline)}</p></div><div style="padding:24px;text-align:start"><p style="font-size:16px">${escapeHtml(ui.greeting)} ${escapeHtml(data.customerName || ui.customer)},</p><p>${escapeHtml(ui.intro)}</p>${imageBlock}<div style="margin:22px 0;padding:20px 12px;text-align:center;border:2px dashed #126b40;border-radius:14px;background:#f0f7f1"><div style="font-size:12px;letter-spacing:2px;color:#50627b;font-weight:700">${escapeHtml(ui.trackingHeading)}</div><div style="font-size:clamp(25px,6vw,34px);font-weight:800;letter-spacing:1px;color:#123d2a;margin:12px 0;overflow-wrap:anywhere">${escapeHtml(tracking)}</div><p style="font-size:12px;color:#50627b;margin:0 0 14px">${escapeHtml(ui.copyHint)}</p><a href="${escapeHtml(`${siteUrl}/copy-tracking.html?code=${encodeURIComponent(tracking)}`)}" style="display:inline-block;background:#ffd43b;color:#10233d;text-decoration:none;font-weight:800;padding:10px 18px;border-radius:8px;font-size:14px;margin-bottom:14px"><span aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:7px;font-size:17px;line-height:1">▢</span>${escapeHtml(ui.copyButton)}</a><br><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#126b40;color:#fff;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:9px;font-size:14px">${escapeHtml(ui.trackingButton)}</a></div><h2 style="font-size:18px;margin:24px 0 10px">${escapeHtml(ui.detailsHeading)}</h2><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${details}</table><div style="text-align:center;margin:28px 0"><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#126b40;color:#fff;text-decoration:none;font-weight:800;padding:16px 28px;border-radius:10px;font-size:16px">${escapeHtml(ui.trackingButton)}</a></div><h2 style="font-size:17px;margin:24px 0 8px">${escapeHtml(ui.messageHeading)}</h2><div style="white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;font-size:14px;color:#30435e">${escapeHtml(message)}</div><p style="margin-top:26px;line-height:1.6">${escapeHtml(ui.closing)}<br><strong>${escapeHtml(ui.company)}</strong><br>${escapeHtml(ui.service)}</p></div><div style="padding:16px 24px;background:#f7f9fc;color:#64748b;text-align:center;font-size:12px">${escapeHtml(ui.company)} — ${escapeHtml(ui.footer)}</div></div></body></html>`;
  const text = `${ui.greeting} ${data.customerName || ui.customer},\n\n${ui.intro}\n\n${ui.trackingHeading}: ${tracking}\n\n${fields.map(([label, value]) => `${label}: ${value || ui.noValue}`).join('\n')}\n\n${message}\n\n${ui.trackLink}: ${trackingUrl}\n\n${ui.closing}\n${ui.company}\n${ui.service}`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: String(pass).replace(/\s+/g, '') }
    });
    await transporter.sendMail({ from: { name: 'National Way Delivery Logistics', address: user }, to, subject, text, html, attachments });
    return json(200, { ok: true, message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Gmail send failed:', error?.message || error);
    return json(502, { error: 'Gmail could not send the email. Check that GMAIL_USER matches the Gmail account used to create the App Password and that the App Password is current.' });
  }
}
