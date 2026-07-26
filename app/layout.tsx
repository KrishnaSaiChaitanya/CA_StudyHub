import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const enablePWA = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "CA StudyHub",
  description: "Comprehensive learning and resource-sharing platform for CA aspirants.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon-pwa-192.png",
  },
  ...(enablePWA ? {
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "CA StudyHub",
    },
  } : {}),
  formatDetection: {
    telephone: false,
  },
};

const poppins = Poppins({
  display: "swap",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

import { ConditionalLayout } from "@/components/shared/ConditionalLayout";
import WelcomeModal from "@/components/shared/WelcomeModal";
import { PWARegister } from "@/components/shared/PwaRegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} font-sans`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
          <main className="flex flex-col items-center">
              <Providers>
                <ConditionalLayout>
                  {children}
                  <WelcomeModal />
                </ConditionalLayout>
                <PWARegister />
              </Providers>
          </main>
          <Analytics />
          <SpeedInsights />
      </body>
    </html>
  );
}
