/**
 * send-whatsapp-invite.mjs
 * ─────────────────────────────────────────────────────────────
 * Läuft täglich um 08:00 UTC (= 09:00 / 10:00 DE).
 * Prüft: Welche Teilnehmerinnen haben ihren ERSTEN Termin
 * eines Kurses genau in 7 Tagen? → WhatsApp-Gruppenlink per Mail.
 * ─────────────────────────────────────────────────────────────
 * Benötigte Netlify-Umgebungsvariablen:
 *   SETMORE_API_KEY        – Setmore Refresh Token
 *   RESEND_API_KEY         – Resend API Key
 *   SUPABASE_URL           – Supabase Projekt-URL
 *   SUPABASE_SERVICE_KEY   – Supabase Service Role Key
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── WhatsApp-Gruppenlinks ──────────────────────────────────────
// Schlüssel: "<kurs>-<wochentag>" (alles lowercase)
const WHATSAPP_LINKS = {
  "mamafit-donnerstag":    "https://chat.whatsapp.com/LOJMO4LnHjLFNiE2lKkPFU",
  "mamafit-freitag":       "https://chat.whatsapp.com/JB3jOpjlY1eDzcyf7ql3LZ",
  "schwangerfit-montag":   "https://chat.whatsapp.com/EIqNdPUNMLwBEvFlBelKfE",
  "somaticyoga-donnerstag":"https://chat.whatsapp.com/HBieE8VTTGg6u7UjoPQXKK",
  "koerpermitte-montag":   "https://chat.whatsapp.com/IRD1PtaVeaOHeZGCjz2o3C",
};

const WOCHENTAGE = ["sonntag","montag","dienstag","mittwoch","donnerstag","freitag","samstag"];

// Ordnet Setmore-Servicename einem Kurs-Schlüssel zu
function kursSchluessel(serviceName, dayIndex) {
  const s = (serviceName ?? "").toLowerCase();
  const tag = WOCHENTAGE[dayIndex];
  if (s.includes("mamafit"))                          return `mamafit-${tag}`;
  if (s.includes("schwangerfit"))                     return `schwangerfit-${tag}`;
  if (s.includes("yoga"))                             return `somaticyoga-${tag}`;
  if (s.includes("körpermitte") || s.includes("koerpermitte") || s.includes("beckenboden")) return `koerpermitte-${tag}`;
  return null;
}

// ── Setmore Access Token ───────────────────────────────────────
async function getAccessToken() {
  const res = await fetch(
    `https://developer.setmore.com/api/v1/o/oauth2/token?refreshToken=${process.env.SETMORE_API_KEY}`
  );
  const data = await res.json();
  return data?.data?.token?.access_token ?? null;
}

// ── E-Mail via Resend ──────────────────────────────────────────
async function sendeMail(email, vorname, kursname, whatsappLink) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Karo · Bauch Baby Beckenboden <kontakt@bauch-baby-beckenboden.com>",
      to: email,
      subject: `Dein Kurs startet nächste Woche 🌿`,
      html: `
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: 'Helvetica Neue', sans-serif; background: #f2ede8; margin: 0; padding: 32px 16px; color: #2a1a1a; }
  .card { background: #fff; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; }
  .header { background: #7a3f3a; padding: 36px 32px 28px; text-align: center; }
  .header p { color: rgba(248,244,240,0.75); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px; }
  .header h1 { color: #f2ede8; font-size: 28px; font-weight: 300; margin: 0; line-height: 1.3; }
  .header h1 em { color: #c4a882; font-style: italic; }
  .body { padding: 32px; }
  .body p { font-size: 15px; line-height: 1.8; color: #4a3a35; margin: 0 0 16px; }
  .btn { display: block; background: #7a3f3a; color: #fff !important; text-decoration: none;
         border-radius: 12px; padding: 16px 24px; text-align: center; font-size: 15px;
         margin: 24px 0; }
  .note { background: #fdf6ee; border: 1px solid #e2d8d0; border-radius: 12px;
          padding: 16px 20px; font-size: 13px; color: #7a5c4a; line-height: 1.7; }
  .footer { text-align: center; padding: 20px; font-size: 11px; color: #a08070;
            letter-spacing: 1.5px; text-transform: uppercase; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <p>Bauch · Baby · Beckenboden</p>
    <h1>Noch eine Woche bis<br><em>${kursname}</em> 🌿</h1>
  </div>
  <div class="body">
    <p>Hej ${vorname},</p>
    <p>dein Kurs startet nächste Woche – ich freue mich so sehr auf dich! 🤍</p>
    <p>Damit du ab Tag 1 mit dabei bist: Tritt jetzt unserer WhatsApp-Gruppe bei. Dort teile ich kurzfristige Infos, Raumänderungen und kleine Erinnerungen rund um den Kurs.</p>
    <a class="btn" href="${whatsappLink}">WhatsApp-Gruppe beitreten →</a>
    <div class="note">
      🌿 Du bekommst nach dem Beitritt eine kurze Begrüßung von mir. Bei Fragen kannst du mich jederzeit direkt anschreiben!
    </div>
  </div>
  <div class="footer">Bauch · Baby · Beckenboden · bauch-baby-beckenboden.de</div>
</div>
</body>
</html>`,
    }),
  });
  return res.ok;
}

// ── Hauptfunktion ──────────────────────────────────────────────
export const config = {
  schedule: "0 8 * * *", // täglich 08:00 UTC
};

export async function handler() {
  // Zieldatum: heute + 7 Tage
  const ziel = new Date();
  ziel.setDate(ziel.getDate() + 7);
  const zielStr = ziel.toISOString().split("T")[0]; // YYYY-MM-DD
  console.log(`🔍 Suche Termine am ${zielStr}...`);

  // 1. Setmore Access Token
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error("❌ Kein Access Token erhalten");
    return { statusCode: 500 };
  }

  // 2. Setmore-Termine abrufen
  const apptRes = await fetch(
    "https://developer.setmore.com/api/v1/bookingapi/appointments",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const apptData = await apptRes.json();
  const alleTermine = apptData?.data?.appointments ?? [];

  // Debug: zeige erstes Appointment-Objekt damit wir Feldnamen sehen
  if (alleTermine.length > 0) {
    console.log("📋 Beispiel-Appointment-Felder:", JSON.stringify(Object.keys(alleTermine[0])));
    console.log("📋 Beispiel-Wert:", JSON.stringify(alleTermine[0]).slice(0, 300));
  }

  // 3. Auf Zieldatum filtern
  // Setmore gibt start_time meist als "YYYY-MM-DDTHH:mm" oder Unix-ms zurück
  const termine = alleTermine.filter((a) => {
    const raw = a.start_time ?? a.start_datetime ?? a.startTime ?? "";
    const dateStr = typeof raw === "number"
      ? new Date(raw).toISOString().split("T")[0]
      : String(raw).slice(0, 10);
    return dateStr === zielStr;
  });

  console.log(`📅 ${termine.length} Termine am ${zielStr} gefunden.`);

  let gesendet = 0;

  for (const termin of termine) {
    const email = termin.customer_email;
    if (!email) continue;

    const serviceName = termin.service_name ?? "";
    const raw = termin.start_time ?? termin.start_datetime ?? termin.startTime ?? "";
    const datum = typeof raw === "number" ? new Date(raw) : new Date(raw);
    const dayIndex = datum.getDay();
    const schluessel = kursSchluessel(serviceName, dayIndex);

    if (!schluessel || !WHATSAPP_LINKS[schluessel]) {
      console.log(`⚠️  Kein Link für: "${serviceName}" (${WOCHENTAGE[dayIndex]})`);
      continue;
    }

    const whatsappLink = WHATSAPP_LINKS[schluessel];

    // 4. Bereits benachrichtigt? (letzte 45 Tage = eine Kursrunde)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 45);

    const { data: existing } = await supabase
      .from("whatsapp_notifications")
      .select("id")
      .eq("email", email)
      .eq("service_key", schluessel)
      .gte("sent_at", cutoff.toISOString())
      .limit(1);

    if (existing?.length > 0) {
      console.log(`⏭️  Bereits benachrichtigt: ${email} (${schluessel})`);
      continue;
    }

    // 5. Mail senden
    const vorname = (termin.customer_name ?? "du").split(" ")[0];
    const kursname = serviceName || schluessel;
    const ok = await sendeMail(email, vorname, kursname, whatsappLink);

    if (ok) {
      // 6. In Supabase loggen
      await supabase.from("whatsapp_notifications").insert({
        email,
        service_key: schluessel,
        kursname: serviceName,
        sent_at: new Date().toISOString(),
      });
      console.log(`✅ Gesendet an ${email} (${schluessel})`);
      gesendet++;
    } else {
      console.error(`❌ Fehler beim Senden an ${email}`);
    }
  }

  console.log(`🎉 Fertig – ${gesendet} Einladungen verschickt.`);
  return { statusCode: 200 };
}
