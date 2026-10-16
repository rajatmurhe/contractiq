import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../index.css";

export const metadata: Metadata = {
  title: "contractIQ | Supplier contract review",
  icons: { icon: "/icon.svg" },
  description:
    "Review supplier contracts with exact source evidence, compare revisions, and record a human decision. Try your own document for free.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
