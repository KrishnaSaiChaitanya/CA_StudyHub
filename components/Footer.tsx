"use client";
import { useEffect, useState } from "react";
import { LogoElement } from "@/assets/logo";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Send } from "lucide-react";

interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  telegram?: string;
}

const Footer = () => {
  const [socials, setSocials] = useState<SocialLinks>({});
  const supabase = createClient();

  useEffect(() => {
    const fetchFooterSocials = async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("content")
          .eq("page_id", "footer")
          .single();
        if (!error && data?.content) {
          setSocials(data.content);
        }
      } catch (err) {
        console.error("Failed to load footer socials:", err);
      }
    };
    fetchFooterSocials();
  }, []);

  const socialIcons = [
    { key: "facebook", icon: Facebook, label: "Facebook" },
    { key: "twitter", icon: Twitter, label: "Twitter" },
    { key: "instagram", icon: Instagram, label: "Instagram" },
    { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
    { key: "youtube", icon: Youtube, label: "YouTube" },
    { key: "telegram", icon: Send, label: "Telegram" },
  ];

  return (
    <footer className="border-t border-border bg-background w-full">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Link href="/" prefetch={false} className="flex items-center gap-2.5 h-16 w-16">
                  <LogoElement />
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                India's all-in-one platform for Chartered Accountancy students.
              </p>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              {socialIcons.map(({ key, icon: Icon, label }) => {
                const url = socials[key as keyof SocialLinks];
                if (!url) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
          {[
            { 
              title: "Platform", 
              links: [
                { name: "Study", href: "/study" },
                { name: "Practice", href: "/practice" },
                { name: "Faculty", href: "/faculty" },
                { name: "Community", href: "/community" }
              ] 
            },
            { 
              title: "Resources", 
              links: [
                { name: "MTPs", href: "/practice/mtp-papers" },
                { name: "RTPs", href: "/practice/rtp-papers" },
                { name: "PYQs", href: "/practice/pyq-bank" },
                { name: "Mock Tests", href: "/practice/mock-exams" }
              ] 
            },
            { 
              title: "Support", 
              links: [
                { name: "Help Center", href: "/help-center" },
                { name: "Contact Us", href: "/contact-us" },
                { name: "Privacy Policy", href: "/privacy-policy" },
                { name: "Terms", href: "/terms" }
              ] 
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} prefetch={false} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CA Study Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

