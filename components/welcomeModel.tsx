"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hand, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";

const STORAGE_KEY = "lumos_welcome_seen";

const WelcomeModal = () => {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const checkWelcome = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
          setOpen(true);
        }
      }
      setChecked(true);
    };

    checkWelcome();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
          setOpen(true);
        }
      } else {
        setOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleContinue = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  if (!checked) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent hideClose className="max-w-3xl p-0 overflow-y-auto overflow-hidden gap-0 border-border bg-background">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">
              Welcome to CA Study Hub!
            </DialogTitle>
            <button
              onClick={handleContinue}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Section 1 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl border border-accent/20 bg-accent/5 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Hand className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  A Note from the Team
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  CA Study Hub is being built by a small team with the goal of making the CA journey simpler and more organized for students. While the platform&apos;s features are fully functional and ready to use, our content library is still growing and will continue to improve over time.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                  We&apos;re constantly adding new resources, refining existing ones, and listening to feedback from the community. If you&apos;d like to contribute resources, suggest improvements, or volunteer in any way, we&apos;d be delighted to hear from you.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                  Thank you for joining us at this early stage and being a part of the journey.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Section 2 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-xl border border-border bg-muted/30 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  A Quick Note on Pricing
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Running and improving CA Study Hub involves ongoing development, maintenance, and operating costs. To keep the platform sustainable, we may introduce a nominal subscription fee in the future.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                  However, our intention is not to place the entire platform behind a paywall. Core features and essential resources will continue to remain free, while only a limited set of advanced features may become part of a paid plan.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                  Any such changes will always be communicated well in advance, and our priority will remain keeping the platform affordable and accessible for students.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Button
              onClick={handleContinue}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
            >
              Got it, Continue
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
