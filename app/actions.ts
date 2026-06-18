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

  // 2. Send email using nodemailer
  if (linkData?.properties?.hashed_token) {
    const confirmLink = `${origin}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=signup&next=/dashboard`;
    
    const emailResult = await sendEmail({
      to: email,
      subject: "Verify your email - CAStudyHub",
      html: getVerificationEmail(confirmLink),
    });

    if (!emailResult.success) {
      console.error("Nodemailer error:", emailResult.error);
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
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect(
      "/sign-in",
      "error",
      error.message);
  }

  if (data?.user) {
    await syncUserActivity(supabase);
  }

  return redirect("/dashboard");
};
export const signInWithGoogle = async (formData: FormData) => {
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?redirect_to=/dashboard`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }

  if (error) {
    return encodedRedirect(
      "/sign-in",
      "error",
      error.message);
  }

  return redirect("/dashboard");
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

  // 2. Send email using nodemailer
  if (linkData?.properties?.hashed_token) {
    const resetLink = `${origin}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;

    const emailResult = await sendEmail({
      to: email,
      subject: "Reset your password - CAStudyHub",
      html: getPasswordResetEmail(resetLink),
    });

    if (!emailResult.success) {
      console.error("Nodemailer error:", emailResult.error);
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
    console.error("Nodemailer error joining waitlist:", emailResult.error);
    return { success: false, error: "Failed to send notification" };
  }

  return { success: true };
};
