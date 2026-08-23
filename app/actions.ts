"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { syncUserActivity } from "@/utils/supabase/profile";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendEmail, getVerificationEmail, getPasswordResetEmail, getWaitlistNotificationEmail } from "@/utils/email";

const siteURL = process.env.NEXT_PUBLIC_SITE_URL;


export const signUpAction = async (formData: FormData) => {  
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const full_name = formData.get("full_name")?.toString();

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const adminClient = createAdminClient();

  if (!email || !password) {
    return encodedRedirect(
      "/sign-up",
      "error",
      "Email and password are required",
    );
  }

  // 1. Generate the verification link (this also creates the user if they don't exist)
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      data: {
        full_name: full_name || "",
      },
      redirectTo: origin ? `${origin}/auth/callback` : `${siteURL}/auth/callback`,
    },
  });

  if (linkError) {
    console.error("Sign up/Link generation error:", linkError.code, linkError.message);
    return encodedRedirect(
      "/sign-up",
      "error",
      linkError.message || "Could not sign up. Please try again."
    );
  }

  // 2. Send email using Resend
  if (linkData?.properties?.hashed_token) {
    const confirmLink = `${origin}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=signup&next=/dashboard`;
    
    const emailResult = await sendEmail({
      to: email,
      subject: "Verify your email - CAStudyHub",
      html: getVerificationEmail(confirmLink),
    });

    if (!emailResult.success) {
      console.error("Resend error:", emailResult.error);
    }
  }

  return encodedRedirect(
    "/sign-up",
    "success",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect_to") as string || "/dashboard";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect(
      `/sign-in?redirect_to=${encodeURIComponent(redirectTo)}`,
      "error",
      error.message);
  }

  if (data?.user) {
    await syncUserActivity(supabase);
  }

  return redirect(redirectTo);
};
export const signInWithGoogle = async (formData: FormData) => {
  const redirectTo = formData.get("redirect_to") as string || "/dashboard";
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }

  if (error) {
    return encodedRedirect(
      `/sign-in?redirect_to=${encodeURIComponent(redirectTo)}`,
      "error",
      error.message);
  }

  return redirect(redirectTo);
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const callbackUrl = formData.get("callbackUrl")?.toString();
  const adminClient = createAdminClient();

  if (!email) {
    return encodedRedirect(
      "/forgot-password",
      "error",
      "Email is required");
  }

  // 1. Generate the recovery link
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: origin ? `${origin}/auth/callback?redirect_to=/reset-password` : `${siteURL}/auth/callback?redirect_to=/reset-password`,
    },
  });

  if (linkError) {
    console.error("Recovery link error:", linkError.message);
    // For security, don't reveal if user doesn't exist, but here we can log it
    return encodedRedirect(
      "/forgot-password",
      "success",
      "If an account exists, you will receive a password reset email."
    );
  }

  // 2. Send email using Resend
  if (linkData?.properties?.hashed_token) {
    const resetLink = `${origin}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;

    const emailResult = await sendEmail({
      to: email,
      subject: "Reset your password - CAStudyHub",
      html: getPasswordResetEmail(resetLink),
    });

    if (!emailResult.success) {
      console.error("Resend error:", emailResult.error);
    }
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "/forgot-password",
    "success",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "/reset-password",
      "error",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "/reset-password",
      "error",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "/reset-password",
      "error",
      "Password update failed",
    );
  }

  return encodedRedirect(
    "/sign-in",
    "success",
    "Password updated successfully. Please sign in with your new password.");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const joinWaitlistAction = async (email: string) => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email address" };
  }

  const adminEmail = process.env.SMTP_FROM_EMAIL;
  if (!adminEmail) {
    console.error("SMTP_FROM_EMAIL is not defined in environment variables");
    return { success: false, error: "Server configuration error" };
  }

  const emailResult = await sendEmail({
    to: adminEmail,
    subject: "New Waitlist Joiner - CAStudyHub",
    html: getWaitlistNotificationEmail(email),
  });

  if (!emailResult.success) {
    console.error("Resend error joining waitlist:", emailResult.error);
    return { success: false, error: "Failed to send notification" };
  }

  return { success: true };
};

export const getUserDetailsAction = async (userId: string) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
  
  const isUserAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());
  if (!isUserAdmin) {
    throw new Error("Unauthorized");
  }

  const adminClient = createAdminClient();
  const { data: { user: targetUser }, error } = await adminClient.auth.admin.getUserById(userId);
  if (error || !targetUser) {
    return { name: "Unknown", email: "Unknown" };
  }

  return {
    name: targetUser.user_metadata?.full_name || "Unknown",
    email: targetUser.email || "Unknown"
  };
};

export const submitFeedbackRatingAction = async (data: {
  overall: number;
  flashcards: number;
  navEase: number;
  recommend: number;
  problem: string;
}) => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to submit rating feedback." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      feedback: {
        overall: data.overall,
        flashcards: data.flashcards,
        nav_ease: data.navEase,
        recommend: data.recommend,
        problem: data.problem,
        submitted_at: new Date().toISOString(),
      }
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error submitting feedback rating:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const submitFeedbackSubmissionAction = async (data: {
  type: "bug" | "feature_request";
  message: string;
}) => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to submit feedback." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name || user.email || "Anonymous User";
  const email = user.email || "unknown@castudyhub.in";
  const subject = data.type === "bug" ? "Bug Report via Feedback Widget" : "Feature Request via Feedback Widget";

  const { error } = await supabase
    .from("contact_submissions")
    .insert({
      name,
      email,
      subject,
      message: data.message,
      type: data.type,
    });

  if (error) {
    console.error("Error submitting feedback contact submission:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
};
