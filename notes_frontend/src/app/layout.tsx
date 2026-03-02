import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Note Keeper",
  description: "Retro-themed note keeper (create, edit, delete, search, tag).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
