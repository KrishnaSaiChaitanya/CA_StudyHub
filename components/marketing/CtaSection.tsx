"use client"
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CtaSection = () => (
  <section className="relative overflow-hidden bg-zinc-950 dark:bg-gradient-to-b dark:from-[#0b132b] dark:to-[#080c1d] py-24">
    {/* Edge gradient fades to the sides - dark mode only */}
    <div className="hidden dark:block absolute top-0 bottom-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-background to-transparent pointer-events-none" />
    <div className="hidden dark:block absolute top-0 bottom-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-background to-transparent pointer-events-none" />

    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-xl text-center"
      >
        <h2 className="text-3xl font-bold text-white md:text-4xl">
          Ready to Ace Your <span className="text-gradient-blue">CA Exams</span>?
        </h2>
        <p className="mt-4 text-sm text-zinc-400">
          Join thousands of CA aspirants studying smarter with CA Study Hub.
        </p>
        <Link href="/sign-in">
        <Button size="lg" className="mt-8 bg-accent text-accent-foreground shadow-accent hover:bg-accent/90">
          Join CA Study Hub — It's Free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        </Link>
      </motion.div>
    </div>
  </section>
);

export default CtaSection;
