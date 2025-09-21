import type { Metadata, Viewport } from "next";

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

export default function ProfilePage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{ children }</>;
}
