import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Engineering Platform",
  description: "Multi-tenant cloud engineering copilot, error triage, and automated repair sandbox.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {children}
      </body>
    </html>
  );
}
