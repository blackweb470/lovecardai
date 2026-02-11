
-- Add sender contact info for anonymous replies
ALTER TABLE public.direct_cards
ADD COLUMN sender_phone text,
ADD COLUMN sender_email text;

-- Create replies table for anonymous replies
CREATE TABLE public.direct_card_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id uuid NOT NULL REFERENCES public.direct_cards(id),
  message text NOT NULL,
  emoji text NOT NULL DEFAULT '💖',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_card_replies ENABLE ROW LEVEL SECURITY;

-- Block direct access - all through edge functions
CREATE POLICY "block_direct_replies" ON public.direct_card_replies FOR ALL USING (false);
