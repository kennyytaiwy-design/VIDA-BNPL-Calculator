import localFont from "next/font/local";

export const clashDisplay = localFont({
  src: "../public/fonts/clash-display/fonts/ClashDisplay-Variable.woff2",
  variable: "--font-clash-display",
  display: "swap",
  preload: false,
});

export const clashGrotesk = localFont({
  src: "../public/fonts/clash-grotesk/fonts/ClashGrotesk-Variable.woff2",
  variable: "--font-clash-grotesk",
  display: "swap",
  preload: false,
});
