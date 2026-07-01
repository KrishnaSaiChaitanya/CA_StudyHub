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
  whatsapp?: string;
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
  >
    <path d="M12.004 0C5.378 0 0 5.378 0 12.004c0 2.115.549 4.18 1.597 6.002L.055 24l6.155-1.615a11.93 11.93 0 0 0 5.794 1.62c6.626 0 12.004-5.378 12.004-12.005C24.008 5.378 18.63 0 12.004 0zm0 22.002c-1.9 0-3.762-.511-5.385-1.478l-.387-.23-3.633.953.97-3.541-.252-.4A10.024 10.024 0 0 1 1.998 12c0-5.514 4.488-10.002 10.006-10.002 5.514 0 10.002 4.488 10.002 10.002 0 5.514-4.488 10.002-10.002 10.002zm5.485-7.49c-.3-.15-1.777-.878-2.052-.977-.275-.1-.475-.15-.675.15-.2.3-.775.976-.95 1.176-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.413-1.488-.892-.796-1.493-1.78-1.669-2.08-.176-.3-.019-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.492-.51-.675-.52l-.575-.01c-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.115 3.23 5.125 4.53.716.31 1.275.495 1.71.635.717.227 1.368.195 1.884.118.575-.087 1.777-.726 2.027-1.428.25-.7.25-1.3 0-1.427-.075-.075-.25-.175-.55-.325z" />
  </svg>
);

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
    { key: "whatsapp", icon: WhatsAppIcon, label: "WhatsApp" },
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

