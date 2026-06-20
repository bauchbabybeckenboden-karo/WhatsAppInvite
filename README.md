# BBB Automationen

Automatische WhatsApp-Gruppenlink-Versand 7 Tage vor Kursstart.

## Repo-Struktur

```
bbb-automationen/
├── netlify.toml                          ← Netlify-Konfiguration
├── package.json                          ← Abhängigkeiten
├── netlify/
│   └── functions/
│       └── send-whatsapp-invite.mjs      ← Die Automation
└── supabase-tabelle.sql                  ← Einmalig in Supabase ausführen
```

---

## Schritt 1: Supabase-Tabelle anlegen

1. supabase.com → dein Projekt → **SQL Editor**
2. Inhalt von `supabase-tabelle.sql` einfügen → **Run**

---

## Schritt 2: GitHub-Repo anlegen

1. github.com → **New repository**
2. Name: `bbb-automationen`
3. Private ✅
4. Alle Dateien aus diesem Paket hochladen

---

## Schritt 3: Netlify verbinden

1. app.netlify.com (bbb.frageboegen-Account) → **Add new project**
2. → **Import an existing project** → **GitHub**
3. GitHub-Account autorisieren (falls noch nicht geschehen)
4. Repo `bbb-automationen` auswählen
5. Build-Einstellungen: alles leer lassen, einfach **Deploy** klicken

---

## Schritt 4: Umgebungsvariablen setzen

In Netlify → Site → **Site configuration → Environment variables**:

| Variable              | Wert                              |
|-----------------------|-----------------------------------|
| `SETMORE_API_KEY`     | r1/35005c31d8hsgi...              |
| `RESEND_API_KEY`      | re_...                            |
| `SUPABASE_URL`        | https://xxx.supabase.co           |
| `SUPABASE_SERVICE_KEY`| eyJ...                            |

---

## Schritt 5: Testen

1. Netlify → **Functions** → `send-whatsapp-invite`
2. Oben rechts: **Test function** → Logs beobachten
3. Beim ersten Aufruf siehst du welche Felder Setmore zurückgibt
   → Falls Datum-Feld falsch: kurz Bescheid geben, kleine Anpassung nötig

---

## Läuft automatisch

Täglich um 08:00 UTC (= 09:00 / 10:00 Uhr DE).
Jede Teilnehmerin bekommt den Link **einmalig** pro Kursrunde,
45 Tage vor einem erneuten Versand geschützt.
