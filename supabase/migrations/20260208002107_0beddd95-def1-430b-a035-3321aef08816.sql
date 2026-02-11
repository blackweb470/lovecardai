
-- Create sections table for anonymous link rooms
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  admin_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Block all direct access to sections table (protects admin_token)
CREATE POLICY "block_direct_select_sections"
  ON public.sections FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "block_direct_insert_sections"
  ON public.sections FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- Public view without admin_token for safe reads
CREATE OR REPLACE VIEW public.sections_public AS
  SELECT id, slug, name, created_at FROM public.sections;

GRANT SELECT ON public.sections_public TO anon;
GRANT SELECT ON public.sections_public TO authenticated;

-- Add section_id to val_cards (nullable for existing data)
ALTER TABLE public.val_cards ADD COLUMN section_id uuid REFERENCES public.sections(id);

-- Drop old SELECT policy on val_cards
DROP POLICY IF EXISTS "Anyone can view cards" ON public.val_cards;

-- Cards can only be read through edge functions with admin token
CREATE POLICY "block_direct_card_reads"
  ON public.val_cards FOR SELECT
  TO anon, authenticated
  USING (false);
