import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatWidget } from "@/components/chat-widget";
import { WhatsAppWidget } from "@/components/whatsapp-widget";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { AccessibilityProvider } from "@/components/providers/accessibility-provider";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Morchantra - Business Concierge",
  description: "Your AI-powered business partner.",
};

import { PlatformProvider } from "@/components/providers/platform-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PlatformProvider>
            <AccessibilityProvider>
                <CurrencyProvider>
                    <SmoothScrollProvider>
                        {children}
                        <ChatWidget />
                        <WhatsAppWidget />
                    </SmoothScrollProvider>
                </CurrencyProvider>
            </AccessibilityProvider>
        </PlatformProvider>
      </body>
    </html>
  );
}
