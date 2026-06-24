"use client"
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import React from "react";
import { LogoElement } from "@/assets/logo";

export default function ResetPasswordView({ searchParams }: { searchParams: Message | undefined }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12 sm:px-6 lg:px-8 w-full">
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <motion.div
           initial={{ opacity: 0, x: 50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="absolute -right-[10%] -top-[10%] h-[60vh] w-[60vw] bg-primary/5 [clip-path:polygon(100%_0,0_0,100%_100%)] md:-right-[5%] md:-top-[5%] md:h-[70vh] md:w-[50vw]"
         />
         <motion.div
           initial={{ opacity: 0, x: -50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
           className="absolute -bottom-[10%] -left-[10%] h-[50vh] w-[50vw] bg-primary/10 [clip-path:polygon(0_100%,0_0,100%_100%)] md:-bottom-[5%] md:-left-[5%] md:h-[60vh] md:w-[40vw]"
         />
       </div>
 
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 0.1 }}
         className="relative z-10 w-full max-w-md"
       >
         <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
             <LogoElement width={80} height={80} />
         </Link>
 
         <Card className="w-full border-accent/20 bg-white/95 backdrop-blur-sm shadow-card transition-all duration-300 hover:shadow-card-hover">
           <CardHeader className="items-center text-center">
             <CardTitle className="text-2xl">Reset Password</CardTitle>
             <CardDescription>Enter your new password below</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6 px-8 pb-8">
             <form className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="password">New Password</Label>
                 <Input
                   id="password"
                   name="password"
                   placeholder="••••••••"
                   type="password"
                   required
                   className="border-accent/20 focus-visible:ring-accent"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="confirmPassword">Confirm Password</Label>
                 <Input
                   id="confirmPassword"
                   name="confirmPassword"
                   placeholder="••••••••"
                   type="password"
                   required
                   className="border-accent/20 focus-visible:ring-accent"
                 />
               </div>
               <SubmitButton
                 pendingText="Updating..."
                 formAction={resetPasswordAction}
                 className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
               >
                 Update Password
               </SubmitButton>
             </form>
 
             {searchParams && <FormMessage message={searchParams} />}
           </CardContent>
         </Card>
       </motion.div>
    </div>
  );
}
