"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, User as UserIcon, LogOut, Crown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { cacheAuthState, clearAuthCache, fetchAndCacheAuthState, getCachedUser, getCachedSubscription } from "@/utils/auth";
import { LogoElement } from "@/assets/logo";
import { useSubscription } from "./SubscriptionProvider";
import { useStudent } from "./StudentTypeProvider";


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
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isSubscribed: isPro, planName, expiryDate } = useSubscription();
  const { studentLevel, refreshProfile } = useStudent();
  const requirePayment = process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === 'true';
  
  const [editName, setEditName] = useState("");
  const [editStudentType, setEditStudentType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const prevPathname = useRef(pathname);
  
  const supabase = createClient();
  const router = useRouter();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("PWA install accepted");
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

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
        .update({ student_type: editStudentType })
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

  const renderUserPopover = (mobile = false) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`flex items-center gap-2 text-sm font-medium text-foreground bg-secondary/50 hover:bg-secondary/70 transition-colors border border-border ${
          mobile ? "px-3 py-2 rounded-lg w-full text-left" : "px-3 py-1.5 rounded-full"
        }`}>
          <UserIcon className="h-4 w-4 text-accent shrink-0" />
          <span className="truncate flex-1 text-left">
            {user?.user_metadata?.full_name || user?.email || "User"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" sideOffset={8}>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Profile Settings</h4>
            <p className="text-sm text-muted-foreground">
              Update your details and view your plan.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-4 text-sm mt-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="col-span-2 px-3 py-1.5 rounded-md bg-secondary/30 border border-border/50 text-xs font-medium text-muted-foreground truncate">
                {user?.email}
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4 text-sm">
              <Label htmlFor={`name-${mobile ? 'mobile' : 'desktop'}`}>Name</Label>
              <Input
                id={`name-${mobile ? 'mobile' : 'desktop'}`}
                value={editName}
                className="col-span-2 h-8"
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4 text-sm">
              <Label htmlFor={`level-${mobile ? 'mobile' : 'desktop'}`}>Level</Label>
              <div className="col-span-2">
                <Select value={editStudentType} onValueChange={setEditStudentType}>
                  <SelectTrigger className="h-8">
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
            <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="mt-2 w-full">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          
          {requirePayment && (
            <div className="border-t border-border pt-4">
              <h4 className="font-medium leading-none text-sm mb-3">Current Plan</h4>
              {isPro ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{planName || "Pro Plan Active"}</span>
                  <Crown className="h-4 w-4 text-accent" />
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Free Plan</span>
                  </div>
                  <Link href="/pricing" className="w-full text-foreground hover:text-foreground">
                    <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-transparent transition-all">
                      Upgrade to Pro <Crown className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (authRoutes.includes(pathname) || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 h-14 w-14">
          <LogoElement />
        </Link>

        <div className="hidden items-center gap-1 md:flex mr-[-120px]">
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

        <div className="hidden items-center gap-3 md:flex !font-semibold">
       
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
              {renderUserPopover(false)}
              <Button variant="ghost" size="sm" type="button" onClick={handleSignOut} className="text-muted-foreground hover:text-white">
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

        <div className="flex items-center gap-2 md:hidden">
          {/* <StudyTimerPill /> */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 h-8 px-2.5 bg-accent/10 border-accent/20 hover:bg-accent/20 text-accent text-xs font-semibold animate-pulse"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </Button>
          )}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border bg-background px-4 pb-4 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block py-3 text-sm font-medium ${
                pathname === item.path ? "text-foreground" : "text-muted-foreground"
              }`}
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
          {isLoading ? (
            <div className="mt-4 flex flex-col gap-2">
              <div className="h-10 w-full bg-secondary/50 animate-pulse rounded-lg"></div>
              <div className="h-10 w-full bg-accent/20 animate-pulse rounded-lg"></div>
            </div>
          ) : user ? (
            <>
              {requirePayment && isPro && (
                <div className="mt-4 flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-accent-foreground bg-accent rounded-lg shadow-sm justify-center">
                  <Crown className="h-4 w-4" />
                  {planName?.toUpperCase() || "PRO PLAN ACTIVE"}
                </div>
              )}
              <div className={`${(requirePayment && isPro) ? 'mt-2' : 'mt-4'} mb-2 flex flex-col gap-2`}>
                {renderUserPopover(true)}
                <Button variant="ghost" size="sm" type="button" onClick={handleSignOut} className="w-full justify-start text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/sign-in" prefetch={false} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">Log in</Button>
              </Link>
              <Link href="/sign-in" prefetch={false} onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full bg-accent text-accent-foreground">Get Started</Button>
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
