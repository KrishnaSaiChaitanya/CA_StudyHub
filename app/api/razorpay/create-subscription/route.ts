import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { plan_id: requestedPlanId, plan_name, plan_type } = await req.json();
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json({ error: "Razorpay credentials not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan_id = requestedPlanId || process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID;

    if (!plan_id) {
      return NextResponse.json({ error: "Razorpay Plan ID not configured" }, { status: 500 });
    }

    const isAnnual = plan_type === "annual" || plan_name?.toLowerCase().includes("annual");
    const total_count = isAnnual ? 5 : 12;

    // Create a subscription with customer notification and tracking metadata in notes
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan_id,
      customer_notify: 1,
      total_count: total_count,
      notes: {
        user_id: user.id,
        user_email: user.email || "",
        plan_id: plan_id,
        plan_name: plan_name || (isAnnual ? "Annual" : "Monthly"),
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
