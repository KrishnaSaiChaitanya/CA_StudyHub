import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan_id: requestedPlanId,
      plan_name = "Pro Plan",
    } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    let customer_id: string | null = null;
    let expiry_date: string | null = null;

    // Fetch subscription details from Razorpay for exact billing cycle & customer ID
    if (key_id && secret) {
      try {
        const razorpay = new Razorpay({ key_id, key_secret: secret });
        const subDetails: any = await razorpay.subscriptions.fetch(razorpay_subscription_id);
        if (subDetails?.customer_id) {
          customer_id = subDetails.customer_id;
        }
        if (subDetails?.current_end) {
          expiry_date = new Date(subDetails.current_end * 1000).toISOString();
        }
      } catch (fetchErr) {
        console.warn("Could not fetch subscription details from Razorpay, falling back to calculation:", fetchErr);
      }
    }

    if (!expiry_date) {
      if (plan_name.toLowerCase().includes("annual")) {
        expiry_date = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        expiry_date = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    const plan_id = requestedPlanId || process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID;
    const supabaseAdmin = createAdminClient();

    // Signature is valid, securely update Supabase using admin client
    const { error } = await supabaseAdmin.from("subscriptions").upsert({
      id: user.id,
      razorpay_subscription_id,
      razorpay_customer_id: customer_id,
      status: "active",
      plan_id: plan_id,
      plan_name,
      expiry_date,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json(
        { error: "Failed to update subscription status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
