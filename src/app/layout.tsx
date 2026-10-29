import type { Metadata } from "next";
import "@fontsource-variable/figtree";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { privatePreviewEnabled } from "@/lib/config/private-preview";
import { THEME_INITIALIZER } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atexgrove",
  description: "Land verification workflow prototype: demo data.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_INITIALIZER }} /></head>
      <body>
        <PreviewBanner enabled={privatePreviewEnabled()} />
        {children}
      </body>
    </html>
  );
}
