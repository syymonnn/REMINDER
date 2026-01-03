import "./globals.css";
import type { Metadata } from "next";
import Providers from "@/providers/Providers";
import BackgroundAurora from "@/components/BackgroundAurora";

export const metadata: Metadata = {
  title: "SY Reminders",
  description: "Smart reminders with groups, context mode, calendar, and weekly insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <BackgroundAurora />
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
