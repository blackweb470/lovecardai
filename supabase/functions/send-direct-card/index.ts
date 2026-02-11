import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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
    const {
      recipient_name,
      recipient_phone,
      recipient_email,
      message,
      emoji,
      style,
      media_url,
      media_type,
      sender_phone,
      sender_email,
    } = await req.json();

    if (!recipient_name || !message) {
      return new Response(
        JSON.stringify({ error: "Missing recipient_name or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recipient_phone && !recipient_email) {
      return new Response(
        JSON.stringify({ error: "Please provide a phone number or email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert the direct card
    const { data: card, error: insertError } = await supabaseAdmin
      .from("direct_cards")
      .insert({
        recipient_name,
        recipient_phone: recipient_phone || null,
        recipient_email: recipient_email || null,
        message,
        emoji: emoji || "💖",
        style: style || 0,
        media_url: media_url || null,
        media_type: media_type || null,
        sender_phone: sender_phone || null,
        sender_email: sender_email || null,
      })
      .select("id, view_token")
      .single();

    if (insertError) throw insertError;

    console.log("Direct card created:", card.id);

    // Build the view URL
    const siteUrl = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "";
    const viewUrl = `${siteUrl}/view/${card.view_token}`;

    const deliveryResults: { whatsapp?: string; email?: string } = {};

    // Send via WhatsApp if phone provided
    if (recipient_phone) {
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
          const cleanPhone = recipient_phone.replace(/\D/g, "");

          const waResponse = await fetch(
            `https://api.ultramsg.com/${waConfig.ultramsg_instance_id}/messages/chat`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: waConfig.ultramsg_token,
                to: cleanPhone,
                body: `💌 Someone sent you an anonymous Val Card!\n\n"${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"\n\nOpen your card here: ${viewUrl}`,
              }),
            }
          );

          const waResult = await waResponse.json();
          console.log("Ultramsg response:", JSON.stringify(waResult));

          if (waResult.sent === "true" || waResult.sent === true) {
            deliveryResults.whatsapp = "sent";
          } else {
            deliveryResults.whatsapp = `failed: ${waResult?.error || "Unknown error"}`;
          }
        } catch (waErr) {
          console.error("Ultramsg send error:", waErr);
          deliveryResults.whatsapp = "failed: network error";
        }
      } else {
        deliveryResults.whatsapp = "skipped: Ultramsg not configured";
        console.log("Ultramsg not configured, skipping");
      }
    }

    // Send via Email if email provided
    if (recipient_email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const { data, error } = await resend.emails.send({
            from: "Val Cards <onboarding@resend.dev>", // Default Resend sender
            to: recipient_email,
            subject: "💌 You received an anonymous Val Card!",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #e11d48; margin-bottom: 24px;">Someone sent you a card! 💖</h1>
                <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
                  You have a new anonymous message waiting for you.
                </p>
                <a href="${viewUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  View Your Card
                </a>
                <p style="margin-top: 32px; color: #666; font-size: 14px; font-style: italic;">
                  It's completely anonymous — you won't know who sent it! 😏
                </p>
              </div>
            `,
          });

          if (error) {
            console.error("Resend error:", error);
            deliveryResults.email = `failed: ${error.message}`;
          } else {
            console.log("Email sent:", data?.id);
            deliveryResults.email = "sent";
          }
        } catch (emailErr) {
          console.error("Email send exception:", emailErr);
          deliveryResults.email = "failed: exception";
        }
      } else {
        console.log("RESEND_API_KEY not set, skipping email");
        deliveryResults.email = "skipped: api key missing";
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        card_id: card.id,
        view_token: card.view_token,
        view_url: viewUrl,
        delivery: deliveryResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-direct-card error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
