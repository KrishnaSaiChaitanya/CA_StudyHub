import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Handle OAuth code exchange: if a `code` param is present, exchange it for a session
    // BEFORE calling getUser(). This ensures the PKCE verifier from cookies is used properly.
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        // Code exchanged successfully — redirect to the intended destination
        // IMPORTANT: Copy cookies from `response` to the redirect, otherwise
        // the session cookies set by exchangeCodeForSession are lost
        const redirectTo = request.nextUrl.searchParams.get("redirect_to") || "/dashboard";
        const redirectResponse = NextResponse.redirect(new URL(redirectTo, request.url));
        response.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
      }
      // If exchange fails, fall through to normal flow
      console.error("OAuth code exchange error:", exchangeError.message);
    }

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user }, error } = await supabase.auth.getUser();

    // Admin email list from environment variable
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    const isUserAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

    // Protected routes
    const protectedPaths = ["/protected", "/study", "/practice", "/faculty", "/community", "/dashboard", "/admin"]
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // Premium paths that require a paid subscription
    const premiumPaths = [
      "/practice/mock-exams",
      "/practice/performance",
      "/bookmarks",
      "/community/rooms"
    ];
    const isPremiumPath = premiumPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // 1. If hitting a protected path and NOT logged in, redirect to sign-in
    if (isProtectedPath && !user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // 2. Premium content check: Only run this query for premium paths to avoid delaying other pages
    const requirePayment = process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === "true";
    if (requirePayment && isPremiumPath && user && !isUserAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_perminent_paid_user")
        .eq("id", user.id)
        .single();

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("id", user.id)
        .single();

      const isSubscribed = profile?.is_perminent_paid_user || subscriptionData?.status === "active";
      
      if (!isSubscribed) {
        return NextResponse.redirect(new URL("/pricing", request.url));
      }
    }

    // 3. If hitting /admin path and NOT an admin, redirect to dashboard
    if (request.nextUrl.pathname.startsWith("/admin") && !isUserAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 4. If on homepage (/) and logged in, redirect based on role
    if (request.nextUrl.pathname === "/" && user) {
      if (isUserAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;

  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
