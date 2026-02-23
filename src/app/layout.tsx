import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DR DXB Server — Deploy ERC-20 Tokens",
  description:
    "Create and deploy standard ERC-20 tokens from your browser. No Remix, no server signing. MetaMask.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" translate="no" style={{ background: "#000" }}>
      <body className="font-sans min-h-screen text-[#e5e5e5]" style={{ background: "#000", margin: 0 }}>
        <div style={{ minHeight: "100vh", background: "#000" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
