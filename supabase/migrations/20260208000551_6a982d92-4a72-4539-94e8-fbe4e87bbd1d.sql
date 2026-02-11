
-- Create val_cards table for storing cards
CREATE TABLE public.val_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_name TEXT NOT NULL,
  message TEXT NOT NULL,
  style INTEGER NOT NULL DEFAULT 0,
  emoji TEXT NOT NULL DEFAULT '💖',
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', NULL)),
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.val_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can view cards (anonymous sharing)
CREATE POLICY "Anyone can view cards"
  ON public.val_cards
  FOR SELECT
  USING (true);

-- Anyone can create cards (anonymous)
CREATE POLICY "Anyone can create cards"
  ON public.val_cards
  FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for card media
INSERT INTO storage.buckets (id, name, public) VALUES ('card-media', 'card-media', true);

-- Anyone can view media
CREATE POLICY "Anyone can view card media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'card-media');

-- Anyone can upload media
CREATE POLICY "Anyone can upload card media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'card-media');
