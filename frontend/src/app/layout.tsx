import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { GameProvider } from "@/contexts/GameContext";
import NavbarWrapper from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mahiro = {
  name: "Mahiro",
  url: "https://discord.com/users/829806976702873621",
};

export const viewport: Viewport = {
  themeColor: "#5040f7",
};

export const metadata: Metadata = {
  title: "Khawawish",
  description:
    "Khawawish: Guess Who, but with bizarre characters—mostly anime!",
  icons: {
    icon: "/favicon.ico",
  },
  authors: [mahiro],
  openGraph: {
    title: "Khawawish",
    description:
      "Khawawish: Guess Who, but with bizarre characters—mostly anime!",
    url: "https://khawawish.mahirou.online",
    siteName: "Khawawish",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950`}
      >
        <AuthProvider>
          <GameProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3000, // 3 seconds
                style: {
                  fontSize: "16px",
                  background: "#333",
                  color: "#fff",
                },
              }}
            />
            <NavbarWrapper>{children} </NavbarWrapper>
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
