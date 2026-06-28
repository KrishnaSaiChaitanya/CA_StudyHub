import { Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Providers } from "@/components/providers";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "CA StudyHub",
  description: "Comprehensive learning and resource-sharing platform for CA aspirants.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CA StudyHub",
  },
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

import { ConditionalLayout } from "@/components/ConditionalLayout";
import WelcomeModal from "@/components/welcomeModel";
import { PWARegister } from "@/components/PWARegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} font-sans`} suppressHydrationWarning>
      <body className="font-sans">
          <main className="flex flex-col items-center">
              <Providers>
                <ConditionalLayout>
                  {children}
                  <WelcomeModal />
                </ConditionalLayout>
                <PWARegister />
              </Providers>
          </main>
      </body>
    </html>
  );
}
