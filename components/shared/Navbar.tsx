"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, User as UserIcon, LogOut, Crown, Calendar, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { cacheAuthState, clearAuthCache, fetchAndCacheAuthState, getCachedUser } from "@/utils/auth";
import { LogoElement } from "@/assets/logo";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import { useStudent } from "@/components/providers/StudentTypeProvider";
import { getUpcomingAttempts } from "@/utils/exam-attempts";
import { StudentLevel } from "@/utils/supabase/types";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Study", path: "/study" },
  { label: "Practice", path: "/practice" },
  { label: "Faculty", path: "/faculty" },
  { label: "Community", path: "/community" },
  { label: "Pricing", path: "/pricing" }
];

const authRoutes = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscribed: isPro, planName, expiryDate } = useSubscription();
  const { studentLevel, examAttemptMonth, examAttemptYear, refreshProfile } = useStudent();
  const requirePayment = process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === 'true';

  const [editName, setEditName] = useState("");
  const [editStudentType, setEditStudentType] = useState("");
  const [editExamAttempt, setEditExamAttempt] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const prevPathname = useRef(pathname);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // PWA Banner States
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    const enablePWA = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";
    if (!enablePWA) return;

    // Check if dismissed
    const isDismissed = localStorage.getItem("pwa-banner-dismissed") === "true";

    // Check if standalone
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone
      || document.referrer.includes("android-app://");

    if (isStandalone || isDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setShowBanner(false);
      localStorage.setItem("pwa-banner-dismissed", "true");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setShowBanner(false);
        localStorage.setItem("pwa-banner-dismissed", "true");
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  const renderThemeToggle = () => {
    const isDark = mounted ? theme === "dark" : false;
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        title={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      >
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="h-[1.15rem] w-[1.15rem] text-amber-400" />
          ) : (
            <Moon className="h-[1.15rem] w-[1.15rem] text-muted-foreground" />
          )}
        </motion.div>
      </Button>
    );
  };

  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setUser(null);
      clearAuthCache();
      router.push("/sign-in");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      if (editName !== user.user_metadata?.full_name) {
        const { data } = await supabase.auth.updateUser({
          data: { full_name: editName }
        });
        if (data?.user) {
          setUser(data.user);
          cacheAuthState(data.user, isPro, planName || undefined, expiryDate || undefined);
        }
      }

      await supabase
        .from("profiles")
        .update({
          student_type: editStudentType,
          full_name: editName,
          exam_attempt_month: editExamAttempt && editExamAttempt !== "none" ? parseInt(editExamAttempt.split('-')[0], 10) : null,
          exam_attempt_year: editExamAttempt && editExamAttempt !== "none" ? parseInt(editExamAttempt.split('-')[1], 10) : null,
        })
        .eq("id", user.id);

      await refreshProfile();
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cachedUser = getCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      setEditName(cachedUser.user_metadata?.full_name || "");
      setIsLoading(false);
    }

    const hydrateUser = async () => {
      const { user: authUser } = await fetchAndCacheAuthState(supabase);
      if (authUser) {
        setUser(authUser);
        setEditName(authUser.user_metadata?.full_name || "");
      } else {
        clearAuthCache();
        setUser(null);
      }
      setIsLoading(false);
    };

    hydrateUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        hydrateUser();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        clearAuthCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const wasAuthRoute = authRoutes.includes(prevPathname.current);
    const isAuthRoute = authRoutes.includes(pathname);

    if (wasAuthRoute && !isAuthRoute) {
      const hydrateUser = async () => {
        setIsLoading(true);
        const { user: authUser } = await fetchAndCacheAuthState(supabase);
        if (authUser) {
          setUser(authUser);
          setEditName(authUser.user_metadata?.full_name || "");
        } else {
          clearAuthCache();
          setUser(null);
        }
        setIsLoading(false);
      };
      hydrateUser();
    }

    prevPathname.current = pathname;
  }, [pathname, supabase]);

  useEffect(() => {
    if (studentLevel) {
      setEditStudentType(studentLevel);
    }
  }, [studentLevel]);

  useEffect(() => {
    if (examAttemptMonth && examAttemptYear) {
      setEditExamAttempt(`${examAttemptMonth}-${examAttemptYear}`);
    } else {
      setEditExamAttempt("");
    }
  }, [examAttemptMonth, examAttemptYear]);

  const attemptOptions = editStudentType
    ? getUpcomingAttempts(editStudentType as StudentLevel, 4)
    : [];

  const renderProfileForm = (idSuffix: string) => {
    return (
      <div className="grid gap-4 mt-2">
        <div className="grid gap-3">
          {/* Email Field */}
          <div className="grid grid-cols-3 items-center gap-4 text-sm">
            <Label className="font-medium text-foreground">Email</Label>
            <div className="col-span-2 px-3 flex items-center h-8 rounded-md bg-secondary/30 border border-border/50 text-sm font-medium text-muted-foreground truncate">
              {user?.email}
            </div>
          </div>

          {/* Name Field */}
          <div className="grid grid-cols-3 items-center gap-4 text-sm">
            <Label htmlFor={`name-${idSuffix}`} className="font-medium text-foreground">Name</Label>
            <Input
              id={`name-${idSuffix}`}
              value={editName}
              className="col-span-2 h-8 text-sm"
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          {/* Level Field */}
          <div className="grid grid-cols-3 items-center gap-4 text-sm">
            <Label htmlFor={`level-${idSuffix}`} className="font-medium text-foreground">Level</Label>
            <div className="col-span-2">
              <Select value={editStudentType} onValueChange={(val) => {
                setEditStudentType(val);
                setEditExamAttempt("");
              }}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attempt Field */}
          {editStudentType && attemptOptions.length > 0 && (
            <div className="grid grid-cols-3 items-center gap-4 text-sm">
              <Label htmlFor={`attempt-${idSuffix}`} className="font-medium text-foreground">Attempt</Label>
              <div className="col-span-2">
                <Select value={editExamAttempt} onValueChange={setEditExamAttempt}>
                  <SelectTrigger className="h-8 text-sm flex items-center gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="h-3.5 w-3.5 opacity-70" />
                      <SelectValue placeholder={attemptOptions[0].label} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{attemptOptions[0].label}</SelectItem>
                    {attemptOptions.slice(1, 5).map((opt) => (
                      <SelectItem key={`${opt.month}-${opt.targetDate.getFullYear()}`} value={`${opt.month}-${opt.targetDate.getFullYear()}`}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="mt-4 w-full">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Payment / Plan Section */}
        {requirePayment && (
          <div className="border-t border-border pt-4 mt-2">
            <h4 className="font-medium leading-none text-sm mb-3">Current Plan</h4>
            {isPro ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{planName || "Pro Plan Active"}</span>
                <Crown className="h-4 w-4 text-accent" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Free Plan</span>
                </div>
                <Link href="/pricing" className="w-full text-foreground hover:text-foreground">
                  <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-transparent transition-all flex items-center justify-center gap-2">
                    Upgrade to Pro <Crown className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderUserPopover = () => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-medium text-foreground bg-secondary/50 hover:bg-secondary/70 transition-colors border border-border px-3 py-1.5 rounded-full">
          <UserIcon className="h-4 w-4 text-accent shrink-0" />
          <span className="truncate max-w-[120px] text-left">
            {user?.user_metadata?.full_name || user?.email || "User"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" sideOffset={8}>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Profile Settings</h4>
            <p className="text-sm text-muted-foreground">
              Update your details.
            </p>
          </div>
          {renderProfileForm("desktop")}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (authRoutes.includes(pathname) || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      {/* PWA Mobile Banner */}
      {showBanner && (
        <div className="w-full bg-background border-b border-border px-4 py-2.5 flex items-center justify-between gap-3 text-xs md:hidden shadow-sm relative z-50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border bg-white p-1">
              <LogoElement />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-xs leading-tight">CA StudyHub App</span>
              <span className="text-[10px] text-muted-foreground leading-normal">Study planners, practice tests</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-[11px] font-semibold px-3.5 py-1 h-7.5 rounded-full shadow-sm transition-all"
            >
              Install
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-7.5 w-7.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 p-0"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className="border-b border-border backdrop-blur-xl bg-background/80 w-full">
        <div className="container flex h-16 items-center justify-between px-8 md:px-4">
          {/* Left Side: Mobile Hamburger Drawer Button & Logo */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu (Mobile Only) */}
            {/* <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg">
                  <Menu className="h-5.5 w-5.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-6 flex flex-col justify-between">
                <div>
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-left font-bold flex items-center gap-2">
                      <span className="h-8 w-8"><LogoElement /></span>
                      <span className="text-gradient-blue text-lg">CA StudyHub</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-4">
                    {navItems.filter((i) => i.path === "/pricing" ? (requirePayment && !isPro) : true).map((item) => {
                      const isActive = item.path === "/" ? pathname === "/" || pathname === "/dashboard" : pathname.includes(item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${isActive
                              ? "bg-accent/10 text-accent font-bold"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground text-center border-t border-border pt-4">
                  © {new Date().getFullYear()} CA StudyHub
                </div>
              </SheetContent>
            </Sheet> */}

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 h-12 w-12">
              <LogoElement />
            </Link>
          </div>

          {/* Center: Desktop Navigation Items */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.filter((i) => i.path === "/pricing" ? (requirePayment && !isPro) : true).map((item) => {
              const isActive = item.path === "/" ? pathname === "/" || pathname === "/dashboard" : pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="relative px-4 py-2 text-sm font-semibold transition-colors"
                  prefetch={false}
                >
                  <span className={isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-accent"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions: Desktop & Mobile */}
          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex !font-semibold">
            {renderThemeToggle()}
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-24 bg-secondary/50 animate-pulse rounded-full"></div>
                <div className="h-8 w-24 bg-accent/20 animate-pulse rounded-md"></div>
              </div>
            ) : user ? (
              <>
                {requirePayment && isPro && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-accent-foreground bg-accent rounded-full shadow-sm whitespace-nowrap">
                    <Crown className="h-3.5 w-3.5" />
                    PRO
                  </div>
                )}
                {renderUserPopover()}
                <Button variant="ghost" size="sm" type="button" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-muted-foreground !font-semibold">Log in</Button>
                </Link>
                <Link href="/sign-in" prefetch={false}>
                  <Button size="sm" className="bg-accent text-accent-foreground shadow-accent hover:bg-accent/90 !font-semibold">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Actions: Top Right beside Profile Icon */}
          <div className="flex items-center gap-1 md:hidden">
            {renderThemeToggle()}
            {isLoading ? (
              <div className="h-8 w-8 bg-secondary/50 animate-pulse rounded-full"></div>
            ) : user ? (
              <div className="flex items-center gap-1">
                {/* Logout Button beside Profile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  title="Log out"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </Button>

                {/* Profile Icon triggers Dialog Modal */}
                <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-secondary/70 hover:bg-secondary border border-border"
                    >
                      <UserIcon className="h-4.5 w-4.5 text-accent" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90%] max-w-[420px] rounded-2xl p-6">
                    <DialogHeader>
                      <DialogTitle>Profile Settings</DialogTitle>
                      <DialogDescription>Update your personal details and preferences.</DialogDescription>
                    </DialogHeader>
                    {renderProfileForm("mobile")}
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs font-semibold px-2.5 h-8">
                    Log in
                  </Button>
                </Link>
                <Link href="/sign-in" prefetch={false}>
                  <Button size="sm" className="bg-accent text-accent-foreground text-xs font-semibold px-3 h-8 shadow-accent">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
        </div>
      </div>
    </nav>
  </div>
);
};

export default Navbar;
