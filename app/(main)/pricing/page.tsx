"use client"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Zap, Star, Upload, Gift, ArrowRight, Clock, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import { fetchAndCacheAuthState } from "@/utils/auth";
import { ProFeaturesModal } from "@/components/pricing/ProFeaturesModal";

const freeFeatures = [
  "MTP, RTP & PYQ Access",
  "MCQ Mock Exams",
  "Group Study Sessions",
  "Leaderboard Rankings",
  "Faculty Database",
  "Exam Calendar",
  "Study Stopwatch Mode",
];

const proFeatures = [
  "Study Planning & Subject Tracking",
  "Request Flashcard Topics",
  "Detailed Mock Exam Performance Analytics",
  "Study Countdown Timer",
  "Notes & Bookmarks",
  "Complete Progress Analytics & Daily Summary",
  "Priority Support",
];

type ProPlan = "monthly" | "annual";

interface PlanInfo {
  id: ProPlan;
  name: string;
  price: string;
  sub: string;
  tag?: string;
  tagVariant?: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
  planId: string | undefined;
  amount: number;
}

const proPlans: PlanInfo[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "₹149",
    sub: "Per month · Billed monthly",
    icon: <Calendar className="h-5 w-5" />,
    planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_MONTHLY,
    amount: 149,
  },
  {
    id: "annual",
    name: "Annual",
    price: "₹899",
    sub: "₹75/month · billed yearly",
    tag: "Most Popular",
    tagVariant: "default",
    icon: <Crown className="h-5 w-5" />,
    planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_ANNUAL,
    amount: 899,
  },
];

const Pricing = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ProPlan>("annual");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);
  const supabase = createClient();
  const { checkSubscription, isSubscribed, planName, expiryDate } = useSubscription();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_REQUIRE_PAYMENT !== 'true') {
      router.push("/dashboard");
    }
  }, [router]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const scrollToPlans = () => {
    const el = document.getElementById("pricing-plans");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubscribe = async () => {
    const currentPlan = proPlans.find(p => p.id === selectedPlan);
    if (!currentPlan?.planId) {
      toast.error("Plan ID not configured for this selection");
      return;
    }

    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please login to subscribe");
        router.push("/sign-in?return_to=/pricing");
        return;
      }

      const res = await loadRazorpay();
      if (!res) {
        toast.error("Failed to load payment gateway");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          plan_id: currentPlan.planId,
          plan_name: currentPlan.name,
          plan_type: currentPlan.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.subscriptionId) {
        toast.error(data.error || "Could not initialize payment");
        setIsLoading(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: "Study Hub Pro",
        description: `${currentPlan.name} Subscription`,
        handler: async function (response: any) {
          const verifyBody = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: currentPlan.planId,
            plan_name: currentPlan.name
          };

          const verifyRes = await fetch("/api/razorpay/verify-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(verifyBody),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            await fetchAndCacheAuthState(supabase);
            await checkSubscription();
            setIsSuccess(true);
            toast.success("Subscription activated successfully!");
            setTimeout(() => {
              router.push("/practice");
            }, 3000);
          } else {
            toast.error(verifyData.error || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
        prefill: {
          email: session.user.email,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on("payment.failed", function (failResponse: any) {
        setIsLoading(false);
        toast.error(failResponse.error?.description || "Payment failed. Please try again.");
      });
      paymentObject.open();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl border border-border bg-card p-12 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-green-500"
          >
            <CheckCircle2 className="h-12 w-12" />
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-3xl font-bold text-foreground"
          >
            Payment Successful!
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-muted-foreground"
          >
            You have opted for <span className="font-semibold text-accent">{planName || (proPlans.find(p => p.id === selectedPlan)?.name)} Plan</span>. 
            {expiryDate && (
              <span className="block mt-2 text-sm italic">
                Valid till: {new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            {!expiryDate && (
              <span className="block mt-2 text-sm italic">
                Access is being activated...
              </span>
            )}
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col gap-3"
          >
            <Button size="lg" onClick={() => router.push("/practice")} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Go to Practice Page
            </Button>
            <p className="text-xs text-muted-foreground">Redirecting in a few seconds...</p>
          </motion.div>
        </motion.div>
        
        <div className="fixed inset-0 -z-10 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-accent/30"
              initial={{ 
                x: "50vw", 
                y: "50vh", 
                scale: 0 
              }}
              animate={{ 
                x: `${Math.random() * 100}vw`, 
                y: `${Math.random() * 100}vh`, 
                scale: Math.random() * 2,
                opacity: 0 
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with rich background for both dark and light modes */}
      <section className="relative overflow-hidden border-b border-border/80 bg-gradient-to-b from-accent/[0.06] via-secondary/30 to-background dark:from-accent/[0.12] dark:via-background/95 dark:to-background py-16 sm:py-20 text-center">
        {/* Subtle dot grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 h-72 w-[600px] rounded-full bg-accent/15 dark:bg-accent/20 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 top-0 h-60 w-60 rounded-full bg-sky-400/10 dark:bg-accent/10 blur-[80px]" />
        <div className="pointer-events-none absolute -right-20 top-0 h-60 w-60 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[80px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="container relative z-10"
        >
          <Badge
            variant="outline"
            className="mb-4 border-accent/40 bg-accent/10 text-accent px-3 py-1 shadow-sm backdrop-blur-sm text-xs font-medium"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5 fill-accent/20" /> Transparent & Simple Pricing
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Choose Your <span className="bg-gradient-to-r from-accent via-sky-500 to-indigo-500 bg-clip-text text-transparent">Plan</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Start free and upgrade when you're ready. Everything you need to crack your CA exams with total clarity.
          </p>

          {/* Clickable prompt to view Pro features modal */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setIsFeaturesModalOpen(true)}
              className="group inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card/80 px-4 py-2 text-xs sm:text-sm font-semibold text-foreground backdrop-blur-md transition-all hover:border-accent hover:bg-accent/10 hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-accent/5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <Sparkles className="h-3 w-3" />
              </span>
              <span>Click to see what features you get with Pro</span>
              <ArrowRight className="h-3.5 w-3.5 text-accent transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      </section>

      <div className="container py-16">
        {/* Tier Cards */}
        <div id="pricing-plans" className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 scroll-mt-10">
          {/* Free Tier */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Star className="h-5 w-5 text-muted-foreground" />
                  Free
                </CardTitle>
                <CardDescription>Everything you need to get started</CardDescription>
                <div className="pt-2">
                  <span className="text-4xl font-bold text-foreground">₹0</span>
                  <span className="text-muted-foreground"> forever</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 pb-4">
                  {freeFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard" className="w-full">
                  <Button variant="outline" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Tier */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="relative h-full border-accent/40 shadow-lg shadow-accent/5">
              <div className="absolute -top-3 right-6">
                <Badge className="bg-accent text-accent-foreground shadow-sm">
                  <Crown className="mr-1 h-3 w-3" /> Pro
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Crown className="h-5 w-5 text-accent" />
                  Pro
                </CardTitle>
                <CardDescription>Unlock the full CA Study Hub experience</CardDescription>

                {/* Click to see features text */}
                <button
                  type="button"
                  onClick={() => setIsFeaturesModalOpen(true)}
                  className="group mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline text-left"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>See what features you get with Pro</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Pro Plan Selector */}
                <div className="space-y-3 pt-3">
                  {proPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        selectedPlan === plan.id
                          ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        selectedPlan === plan.id ? "border-accent" : "border-muted-foreground/40"
                      }`}>
                        {selectedPlan === plan.id && (
                          <div className="h-2 w-2 rounded-full bg-accent" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{plan.name}</span>
                          {plan.tag && (
                            <Badge variant={plan.tagVariant} className={`text-[10px] px-1.5 py-0 ${
                              plan.tag === "Most Popular" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                            }`}>
                              {plan.tag}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{plan.sub}</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">{plan.price}</span>
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isLoading || isSubscribed}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isLoading ? (
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  ) : isSubscribed ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Clock className="mr-2 h-4 w-4" />
                  )}
                  {isSubscribed ? "Current Plan Active" : isLoading ? "Processing..." : "Start Subscription"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Secure payment via Razorpay · Cancel anytime
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pro Features Modal */}
        <ProFeaturesModal
          open={isFeaturesModalOpen}
          onOpenChange={setIsFeaturesModalOpen}
          onUpgrade={scrollToPlans}
        />

        {/* Contribute & Earn Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <Card className="border-dashed border-accent/30 bg-accent/[0.02]">
            <CardContent className="flex flex-col items-center gap-6 p-8 text-center md:flex-row md:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <Gift className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  Contribute & Earn Pro Access
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload quality resources — notes, summaries, solved papers — to the Community Library and earn
                  free days of Pro access for every approved contribution.
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <Badge variant="outline" className="border-accent/30 text-accent">
                    <Upload className="mr-1 h-3 w-3" /> Upload Resources
                  </Badge>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Badge variant="outline" className="border-accent/30 text-accent">
                    Get Reviewed
                  </Badge>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Badge variant="outline" className="border-accent/30 text-accent">
                    <Crown className="mr-1 h-3 w-3" /> Earn Pro Days
                  </Badge>
                </div>
              </div>
              <Button variant="outline" disabled={true} className="shrink-0 border-accent/30 text-accent hover:bg-accent/10">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      
    </div>
  );
};

export default Pricing;
