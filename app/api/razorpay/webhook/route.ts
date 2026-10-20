import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";

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
      console.warn("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const supabaseAdmin = createAdminClient();

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    // Handle Subscription Events
    if (event.startsWith("subscription.")) {
      const subscription = payload.payload.subscription?.entity;
      if (!subscription) {
        return NextResponse.json({ error: "Missing subscription entity" }, { status: 400 });
      }

      const razorpaySubscriptionId = subscription.id;
      const rawStatus = subscription.status; // active, halted, cancelled, paused, completed, etc.
      const userId = subscription.notes?.user_id;
      const customerId = subscription.customer_id;
      const planId = subscription.plan_id;
      const planName = subscription.notes?.plan_name;

      let expiryDate: string | null = null;
      if (subscription.current_end) {
        expiryDate = new Date(subscription.current_end * 1000).toISOString();
      }

      const updateData: Record<string, any> = {
        status: rawStatus,
        updated_at: new Date().toISOString(),
      };

      if (expiryDate) {
        updateData.expiry_date = expiryDate;
      }
      if (customerId) {
        updateData.razorpay_customer_id = customerId;
      }
      if (planId) {
        updateData.plan_id = planId;
      }
      if (planName) {
        updateData.plan_name = planName;
      }

      if (userId) {
        const { error } = await supabaseAdmin.from("subscriptions").upsert({
          id: userId,
          razorpay_subscription_id: razorpaySubscriptionId,
          ...updateData,
        });

        if (error) {
          console.error(`[Razorpay Webhook] Failed upserting subscription for user ${userId}:`, error);
          return NextResponse.json({ error: "Database upsert failed" }, { status: 500 });
        }
      } else {
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update(updateData)
          .eq("razorpay_subscription_id", razorpaySubscriptionId);

        if (error) {
          console.error(`[Razorpay Webhook] Failed updating subscription ${razorpaySubscriptionId}:`, error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
      }
    }

    // Handle Invoice Payment Failure (marks subscription past_due / unpaid immediately)
    if (event === "invoice.payment_failed") {
      const invoice = payload.payload.invoice?.entity;
      if (invoice?.subscription_id) {
        console.warn(`[Razorpay Webhook] Invoice payment failed for subscription: ${invoice.subscription_id}`);
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", invoice.subscription_id);

        if (error) {
          console.error("[Razorpay Webhook] Failed marking subscription past_due:", error);
        }
      }
    }

    // Handle Individual Payment Failures
    if (event === "payment.failed") {
      const payment = payload.payload.payment?.entity;
      console.warn(`[Razorpay Webhook] Payment failed: ${payment?.id}, reason: ${payment?.error_description}`);
      if (payment?.invoice_id) {
        // If related to an invoice, look for matching subscription to mark past_due
        const invoice = payload.payload.invoice?.entity;
        if (invoice?.subscription_id) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("razorpay_subscription_id", invoice.subscription_id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
