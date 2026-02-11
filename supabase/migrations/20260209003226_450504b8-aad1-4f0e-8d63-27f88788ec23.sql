
-- Admin settings table for storing API configurations (WhatsApp, etc.)
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Block all direct access (only edge functions with service role can access)
CREATE POLICY "block_direct_admin_settings" ON public.admin_settings
FOR ALL USING (false);

-- Direct cards table for private 1-on-1 anonymous cards
CREATE TABLE public.direct_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_name text NOT NULL,
  recipient_phone text,
  recipient_email text,
  message text NOT NULL,
  emoji text NOT NULL DEFAULT '💖',
  style integer NOT NULL DEFAULT 0,
  media_url text,
  media_type text,
  view_token uuid NOT NULL DEFAULT gen_random_uuid(),
  is_viewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_cards ENABLE ROW LEVEL SECURITY;

-- Block direct reads (only via edge function or view token)
CREATE POLICY "block_direct_reads_direct_cards" ON public.direct_cards
FOR SELECT USING (false);

-- Allow anonymous inserts (anyone can send a direct card)
CREATE POLICY "anyone_can_send_direct_cards" ON public.direct_cards
FOR INSERT WITH CHECK (true);
