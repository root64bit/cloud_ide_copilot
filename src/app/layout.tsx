import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OQVEN — Give it a task. Get working code.",
  description: "OQVEN: Autonomous & interactive AI engineering platform with isolated sandboxes, deterministic validation, and human-in-the-loop release gates.",
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
