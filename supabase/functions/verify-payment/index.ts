import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { reference } = await req.json();

    if (!reference) {
      console.error("verify-payment: Missing payment reference");
      return new Response(
        JSON.stringify({ error: "Missing payment reference", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secretKey) {
      console.error("verify-payment: PAYSTACK_SECRET_KEY not configured in Supabase secrets");
      return new Response(
        JSON.stringify({
          error: "Payment verification not configured. Please contact support.",
          verified: false,
          details: "PAYSTACK_SECRET_KEY environment variable is missing"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`verify-payment: Verifying transaction reference: ${reference}`);

    // Verify transaction with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (!verifyRes.ok) {
      console.error(`verify-payment: Paystack API returned status ${verifyRes.status}`);
      const errorText = await verifyRes.text();
      console.error(`verify-payment: Paystack API error response: ${errorText}`);
      return new Response(
        JSON.stringify({
          error: "Failed to verify payment with Paystack",
          verified: false,
          details: `API returned status ${verifyRes.status}`
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifyData = await verifyRes.json();
    console.log("verify-payment: Paystack verify response:", JSON.stringify(verifyData));

    if (!verifyData.status || verifyData.data?.status !== "success") {
      console.error("verify-payment: Payment verification failed", verifyData);
      return new Response(
        JSON.stringify({
          error: "Payment not verified",
          verified: false,
          details: verifyData.message || "Transaction status is not successful"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check amount is at least 10000 kobo (₦100)
    if (verifyData.data.amount < 10000) {
      console.error(`verify-payment: Insufficient amount: ${verifyData.data.amount} kobo`);
      return new Response(
        JSON.stringify({
          error: "Insufficient payment amount",
          verified: false,
          details: `Expected ₦100, received ₦${verifyData.data.amount / 100}`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`verify-payment: Successfully verified payment for reference ${reference}`);
    return new Response(
      JSON.stringify({ verified: true, reference: verifyData.data.reference }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-payment error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({
        error: "Payment verification failed",
        verified: false,
        details: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
