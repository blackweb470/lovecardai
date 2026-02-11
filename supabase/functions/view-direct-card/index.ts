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
    const { view_token } = await req.json();

    if (!view_token) {
      return new Response(
        JSON.stringify({ error: "Missing view_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the card by view token
    const { data: card, error } = await supabaseAdmin
      .from("direct_cards")
      .select("*")
      .eq("view_token", view_token)
      .maybeSingle();

    if (error || !card) {
      console.log("Card not found for token:", view_token);
      return new Response(
        JSON.stringify({ error: "Card not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as viewed if first time
    if (!card.is_viewed) {
      await supabaseAdmin
        .from("direct_cards")
        .update({ is_viewed: true })
        .eq("id", card.id);
      console.log("Card marked as viewed:", card.id);
    }

    console.log("Card viewed:", card.id);

    // Check if sender enabled replies (don't expose their contact details!)
    const canReply = !!(card.sender_phone || card.sender_email);

    return new Response(
      JSON.stringify({
        card: {
          id: card.id,
          recipient_name: card.recipient_name,
          message: card.message,
          emoji: card.emoji,
          style: card.style,
          media_url: card.media_url,
          media_type: card.media_type,
          created_at: card.created_at,
          can_reply: canReply,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("view-direct-card error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
