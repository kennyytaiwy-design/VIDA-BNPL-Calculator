import type { Metadata } from "next";
import { Provider } from "./provider";
import { clashDisplay, clashGrotesk } from "./fonts";
import "./globals.css";

import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "VIDA BNPL Loan Calculator",
  description: "BNPL loan repayment calculator for VIDA",
  // manifest is intentionally absent here — it lives in app/page.tsx only
  // so that ONLY "/" gets <link rel="manifest">. Merchant and not-found pages
  // must not be installable as PWAs.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BNPL Calc",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${clashDisplay.variable} ${clashGrotesk.variable}`} suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
