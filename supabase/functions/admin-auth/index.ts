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
    const { action, password, settings } = await req.json();
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!adminPassword || password !== adminPassword) {
      console.log("Invalid admin password attempt");
      return new Response(
        JSON.stringify({ error: "Invalid password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "get_settings") {
      const { data, error } = await supabaseAdmin
        .from("admin_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        settingsMap[row.setting_key] = row.setting_value;
      });

      console.log("Admin fetched settings, keys:", Object.keys(settingsMap));
      return new Response(
        JSON.stringify({ settings: settingsMap }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "save_settings" && settings) {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabaseAdmin
          .from("admin_settings")
          .upsert(
            { setting_key: key, setting_value: value as string, updated_at: new Date().toISOString() },
            { onConflict: "setting_key" }
          );
        if (error) throw error;
      }

      console.log("Admin saved settings:", Object.keys(settings));
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("admin-auth error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
