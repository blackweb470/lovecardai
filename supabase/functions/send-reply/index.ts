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
    const { view_token, message, emoji } = await req.json();

    if (!view_token || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing view_token or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (message.trim().length > 300) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 300 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the original card
    const { data: card, error: cardError } = await supabaseAdmin
      .from("direct_cards")
      .select("id, sender_phone, sender_email, recipient_name")
      .eq("view_token", view_token)
      .maybeSingle();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ error: "Card not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!card.sender_phone && !card.sender_email) {
      return new Response(
        JSON.stringify({ error: "The sender did not enable replies for this card" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save the reply
    const { error: insertError } = await supabaseAdmin
      .from("direct_card_replies")
      .insert({
        card_id: card.id,
        message: message.trim(),
        emoji: emoji || "💖",
      });

    if (insertError) throw insertError;

    const deliveryResults: { whatsapp?: string; email?: string } = {};

    // Send reply via WhatsApp if sender provided phone
    if (card.sender_phone) {
      const { data: waSettings } = await supabaseAdmin
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["ultramsg_token", "ultramsg_instance_id"]);

      const waConfig: Record<string, string> = {};
      (waSettings || []).forEach((row: any) => {
        waConfig[row.setting_key] = row.setting_value;
      });

      if (waConfig.ultramsg_token && waConfig.ultramsg_instance_id) {
        try {
          const cleanPhone = card.sender_phone.replace(/\D/g, "");

          const waResponse = await fetch(
            `https://api.ultramsg.com/${waConfig.ultramsg_instance_id}/messages/chat`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: waConfig.ultramsg_token,
                to: cleanPhone,
                body: `💌 ${card.recipient_name} replied to your anonymous Val Card!\n\n${emoji || "💖"} "${message.trim().substring(0, 150)}${message.trim().length > 150 ? "..." : ""}"\n\n— sent anonymously 💌`,
              }),
            }
          );

          const waResult = await waResponse.json();
          console.log("Ultramsg reply response:", JSON.stringify(waResult));
          deliveryResults.whatsapp = (waResult.sent === "true" || waResult.sent === true) ? "sent" : `failed: ${waResult?.error || "Unknown error"}`;
        } catch (waErr) {
          console.error("Ultramsg reply error:", waErr);
          deliveryResults.whatsapp = "failed: network error";
        }
      } else {
        deliveryResults.whatsapp = "skipped: Ultramsg not configured";
      }
    }

    if (card.sender_email) {
      deliveryResults.email = "link_generated";
    }

    return new Response(
      JSON.stringify({ success: true, delivery: deliveryResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-reply error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
