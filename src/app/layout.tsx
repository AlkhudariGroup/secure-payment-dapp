import type { Metadata } from "next";
import "./globals.css";
import { AppGate } from "@/components/AppGate";

export const metadata: Metadata = {
  title: "مولد التوكنات — إنشاء ونشر توكنات ERC-20 و BEP-20",
  description:
    "منصة حية لإنشاء ونشر توكنات على Ethereum و BNB Smart Chain. اتصل بمحفظتك، انشر العقد، وأرسل التوكنات. نشر حقيقي على الشبكات — ليس تجريبي.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" translate="no">
      <body className="h-screen overflow-hidden text-slate-100 font-sans m-0">
        <div className="h-screen overflow-hidden w-full">
          <AppGate>{children}</AppGate>
        </div>
      </body>
    </html>
  );
}
