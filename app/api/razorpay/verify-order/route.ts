import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      plan_name,
    } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    let expiry_date = null;
    // For direct orders (Attempt Based), calculate expiry
    if (plan_name.toLowerCase().includes("attempt")) {
      // Fetch user profile to get student_type
      const { data: profile } = await supabase
        .from("profiles")
        .select("student_type")
        .eq("id", user.id)
        .single();

      if (profile?.student_type) {
        // Fetch exam date for this level
        const { data: examData } = await supabase
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
          expiry_date = baseDate.toISOString();
        }
      }
    }

    // Update Subscriptions table to track this as an active "one-time" subscription
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("subscriptions").upsert({
      id: user.id,
      razorpay_customer_id: razorpay_payment_id, // Store payment ID if no customer ID
      status: "active",
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
