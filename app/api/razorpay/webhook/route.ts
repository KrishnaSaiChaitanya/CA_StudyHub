import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not set");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const supabase = await createClient();

    if (event.startsWith("subscription.")) {
      const subscription = payload.payload.subscription.entity;
      const razorpaySubscriptionId = subscription.id;
      const status = subscription.status; // active, cancelled, paused, halted, etc.

      // Map Razorpay status to our internal status if needed
      // Razorpay statuses: created, authenticated, active, pending, halted, cancelled, completed, expired, paused
      
      const { error } = await supabase
        .from("subscriptions")
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq("razorpay_subscription_id", razorpaySubscriptionId);

      if (error) {
        console.error("Error updating subscription status from webhook:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing Razorpay webhook:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
