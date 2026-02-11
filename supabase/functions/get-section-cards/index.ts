import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { slug, admin_token } = await req.json();

    if (!slug || !admin_token) {
      return new Response(
        JSON.stringify({ error: "Missing slug or admin_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin token
    const { data: section, error: sectionError } = await supabaseAdmin
      .from("sections")
      .select("*")
      .eq("slug", slug)
      .eq("admin_token", admin_token)
      .single();

    if (sectionError || !section) {
      console.log("Invalid admin access attempt for slug:", slug);
      return new Response(
        JSON.stringify({ error: "Invalid or unauthorized access" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all cards for this section
    const { data: cards, error: cardsError } = await supabaseAdmin
      .from("val_cards")
      .select("*")
      .eq("section_id", section.id)
      .order("created_at", { ascending: false });

    if (cardsError) throw cardsError;

    console.log("Admin view for section:", slug, "cards:", cards?.length || 0);

    return new Response(
      JSON.stringify({
        section: { id: section.id, slug: section.slug, name: section.name, created_at: section.created_at },
        cards: cards || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("get-section-cards error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
