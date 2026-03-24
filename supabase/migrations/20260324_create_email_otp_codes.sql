create table if not exists public.email_otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  user_id uuid null,
  expires_at timestamptz not null,
  used boolean not null default false,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_otp_codes_email on public.email_otp_codes (email);
create index if not exists idx_email_otp_codes_expires_at on public.email_otp_codes (expires_at);

alter table public.email_otp_codes enable row level security;

