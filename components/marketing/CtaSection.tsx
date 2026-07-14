"use client"
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CtaSection = () => (
  <section className="bg-primary py-24">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-xl text-center"
      >
        <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
          Ready to Ace Your <span className="text-gradient-blue">CA Exams</span>?
        </h2>
        <p className="mt-4 text-sm text-primary-foreground/50">
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
