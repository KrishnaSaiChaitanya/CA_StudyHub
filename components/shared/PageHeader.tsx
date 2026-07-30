"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title?: ReactNode;
  gradientTitle?: string;
  description?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  backText?: string;
  size?: "md" | "lg";
}

export default function PageHeader({
  title,
  gradientTitle,
  description,
  onBack,
  showBack,
  backText = "Back to Study Tools",
  size = "md",
}: PageHeaderProps) {
  const isLarge = false;

  return (
    <section
      className={
        isLarge
          ? "bg-zinc-950 dark:bg-gradient-to-br from-accent/10 via-card to-card py-10 md:py-20 w-full"
          : "bg-zinc-950 dark:bg-gradient-to-br from-accent/10 via-card to-card py-8 md:py-16 mx-auto w-full"
      }
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={
            isLarge
              ? "mx-auto max-w-xl text-center text-center"
              : "mx-auto flex flex-col items-center text-center"
          }
        >
          {(onBack || showBack) && (
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else if (showBack) {
                  if (typeof window !== "undefined") {
                    window.history.back();
                  }
                }
              }}
              className="mb-3 md:mb-4 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {backText}
            </button>
          )}

          <h1
            className={
              isLarge
                ? "text-3xl md:text-4xl font-bold text-white"
                : "text-2xl md:text-3xl font-bold text-white"
            }
          >
            {title}
            {gradientTitle && (
              <>
                {" "}
                <span className="text-gradient-blue">{gradientTitle}</span>
              </>
            )}
          </h1>

          {description && (
            <p
              className={
                isLarge
                  ? "mt-3 md:mt-4 text-sm text-zinc-400"
                  : "mt-2 text-sm text-zinc-400"
              }
            >
              {description}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
