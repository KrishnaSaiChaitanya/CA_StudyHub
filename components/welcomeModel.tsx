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
      <DialogContent hideClose className="w-[95vw] sm:w-full max-w-3xl p-0 max-h-[90vh] overflow-y-auto overflow-x-hidden gap-0 border-border bg-background rounded-xl">
        <DialogHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
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

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Section 1 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Hand className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Welcome to CA Study Hub
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  CA Study Hub is built by a small team with a mission to make the CA journey simpler and more organized. While all major features are live, our content library is still growing and will continue to improve over time.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                  We&apos;re constantly adding resources and refining the platform based on community feedback. If you&apos;d like to contribute resources, suggest improvements, or volunteer, we&apos;d love to hear from you.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                  Thank you for being an early part of our journey.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Section 2 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  A Note on Pricing
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  To support ongoing development and maintenance, we may introduce a small subscription fee in the future. However, our goal is to keep core features and essential resources free, with only select advanced features potentially becoming premium.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                  Any changes will be communicated well in advance, and affordability for students will remain a priority.
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
