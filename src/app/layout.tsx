import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Father & Sun - Closer Form",
  description: "After appointment disposition form",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
