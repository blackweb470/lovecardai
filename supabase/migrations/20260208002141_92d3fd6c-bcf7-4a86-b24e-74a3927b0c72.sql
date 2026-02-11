
-- Fix: Replace security definer view with a security definer function
-- This is safer as functions with SECURITY DEFINER are standard pattern

-- Drop the view
DROP VIEW IF EXISTS public.sections_public;

-- Create a security definer function to safely read section info without admin_token
CREATE OR REPLACE FUNCTION public.get_section_by_slug(p_slug text)
RETURNS TABLE(id uuid, slug text, name text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.slug, s.name, s.created_at
  FROM public.sections s
  WHERE s.slug = p_slug
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_section_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_section_by_slug(text) TO authenticated;
