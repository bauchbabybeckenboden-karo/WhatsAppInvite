-- Einmalig in Supabase SQL Editor ausführen
create table if not exists whatsapp_notifications (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  service_key text not null,
  kursname    text,
  sent_at     timestamptz not null default now()
);

-- Index für schnelle Duplikatprüfung
create index if not exists idx_wa_notif_lookup
  on whatsapp_notifications (email, service_key, sent_at);
