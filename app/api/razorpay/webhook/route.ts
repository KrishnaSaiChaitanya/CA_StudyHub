import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";

// Helper to calculate attempt-based expiry from user's student level and exam dates
async function calculateAttemptExpiry(supabaseAdmin: any, userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("student_type")
      .eq("id", userId)
      .single();

    if (profile?.student_type) {
      const { data: examData } = await supabaseAdmin
        .from("exam_dates")
        .select("exam_date")
        .eq("level", profile.student_type)
        .single();

      if (examData?.exam_date) {
        const baseDate = new Date(examData.exam_date);
        let extraDays = 0;

        if (profile.student_type === "final") {
          extraDays = 10 + 3;
        } else if (profile.student_type === "foundation") {
          extraDays = 6 + 3;
        } else if (profile.student_type === "intermediate") {
          extraDays = 14 + 3;
        }

        baseDate.setDate(baseDate.getDate() + extraDays);
        return baseDate.toISOString();
      }
    }
  } catch (err) {
    console.error("[Razorpay Webhook] Error calculating attempt expiry:", err);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
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
      console.warn("[Razorpay Webhook] Invalid webhook signature detected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const supabaseAdmin = createAdminClient();

    console.log(`[Razorpay Webhook] Received verified event: ${event}`);

    // ==========================================
    // 1. Handle Recurring Subscription Events
    // ==========================================
    if (event.startsWith("subscription.")) {
      const subscription = payload.payload.subscription?.entity;
      if (!subscription) {
        return NextResponse.json({ error: "Missing subscription entity" }, { status: 400 });
      }

      const razorpaySubscriptionId = subscription.id;
      const rawStatus = (subscription.status || "").toLowerCase();
      const userId = subscription.notes?.user_id || subscription.notes?.userId;
      const customerId = subscription.customer_id;
      const planId = subscription.plan_id;
      const planName = subscription.notes?.plan_name || subscription.notes?.planName || "Pro Plan";

      // Map status into standard internal status ("active", "past_due", "cancelled", etc.)
      let normalizedStatus = "active";
      if (
        event === "subscription.halted" ||
        rawStatus === "halted" ||
        rawStatus === "pending"
      ) {
        normalizedStatus = "past_due";
      } else if (
        event === "subscription.cancelled" ||
        rawStatus === "cancelled"
      ) {
        normalizedStatus = "cancelled";
      } else if (
        event === "subscription.paused" ||
        rawStatus === "paused"
      ) {
        normalizedStatus = "paused";
      } else if (
        event === "subscription.charged" ||
        event === "subscription.activated" ||
        event === "subscription.resumed" ||
        rawStatus === "active" ||
        rawStatus === "authenticated"
      ) {
        normalizedStatus = "active";
      }

      let expiryDate: string | null = null;
      if (subscription.current_end) {
        expiryDate = new Date(subscription.current_end * 1000).toISOString();
      } else {
        // Fallback calculation if current_end is not in webhook payload
        if (planName.toLowerCase().includes("annual")) {
          expiryDate = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          expiryDate = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      const updateData: Record<string, any> = {
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
      };

      if (expiryDate) updateData.expiry_date = expiryDate;
      if (customerId) updateData.razorpay_customer_id = customerId;
      if (planId) updateData.plan_id = planId;
      if (planName) updateData.plan_name = planName;

      if (userId) {
        const { error } = await supabaseAdmin.from("subscriptions").upsert({
          id: userId,
          razorpay_subscription_id: razorpaySubscriptionId,
          ...updateData,
        });

        if (error) {
          console.error(`[Razorpay Webhook] Upsert failed for user ${userId}:`, error);
          return NextResponse.json({ error: "Database upsert failed" }, { status: 500 });
        }
        console.log(`[Razorpay Webhook] Successfully upserted subscription for user ${userId} (status: ${normalizedStatus})`);
      } else {
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update(updateData)
          .eq("razorpay_subscription_id", razorpaySubscriptionId);

        if (error) {
          console.error(`[Razorpay Webhook] Update failed for sub ${razorpaySubscriptionId}:`, error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
        console.log(`[Razorpay Webhook] Updated subscription ${razorpaySubscriptionId}`);
      }
    }

    // ==========================================
    // 2. Handle One-Time Orders & Direct Payments (Attempt-based, etc.)
    // ==========================================
    if (event === "order.paid" || event === "payment.captured") {
      const payment = payload.payload.payment?.entity;
      const order = payload.payload.order?.entity;

      // Extract notes attached during order creation or checkout
      const notes = payment?.notes || order?.notes || {};
      const userId = notes.userId || notes.user_id;
      const planName = notes.planName || notes.plan_name || "Pro Plan";

      // If it has an invoice_id and belongs to a subscription, it's already handled by subscription.* events
      const isSubscriptionInvoice = Boolean(payment?.invoice_id);

      if (userId && !isSubscriptionInvoice) {
        let expiryDate: string | null = null;

        if (planName.toLowerCase().includes("attempt")) {
          expiryDate = await calculateAttemptExpiry(supabaseAdmin, userId);
        } else if (planName.toLowerCase().includes("annual")) {
          expiryDate = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          // Default monthly / standard fallback
          expiryDate = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
        }

        const { error } = await supabaseAdmin.from("subscriptions").upsert({
          id: userId,
          razorpay_customer_id: payment?.id || order?.id,
          status: "active",
          plan_name: planName,
          expiry_date: expiryDate,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error(`[Razorpay Webhook] Failed upserting one-time order for user ${userId}:`, error);
          return NextResponse.json({ error: "Database upsert failed" }, { status: 500 });
        }

        console.log(`[Razorpay Webhook] Successfully activated one-time purchase for user ${userId} (${planName})`);
      }
    }

    // ==========================================
    // 3. Handle Invoice Payment Failures
    // ==========================================
    if (event === "invoice.payment_failed") {
      const invoice = payload.payload.invoice?.entity;
      if (invoice?.subscription_id) {
        console.warn(`[Razorpay Webhook] Invoice payment failed for subscription: ${invoice.subscription_id}`);
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", invoice.subscription_id);
      }
    }

    // ==========================================
    // 4. Handle Individual Payment Failures
    // ==========================================
    if (event === "payment.failed") {
      const payment = payload.payload.payment?.entity;
      console.warn(`[Razorpay Webhook] Payment failed: ${payment?.id}, reason: ${payment?.error_description}`);
      if (payment?.invoice_id) {
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
