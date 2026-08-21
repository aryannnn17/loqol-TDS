import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loqol TDS Prototype",
  description:
    "A take-home prototype for a calmer California TDS disclosure experience.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
