import type { Metadata, Viewport } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeController } from "@/components/theme-controller";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getThemeInitializationScript } from "@/lib/theme";
import "./globals.css";

const noto_sans_kr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  display: "swap",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "R.",
  description:
    "모든 것에 대하여 리뷰를 작성하고 공유할 수 있는 곳.",
  openGraph: {
    title: "R.",
    description: "모든 것에 대하여 리뷰를 작성하고 공유할 수 있는 곳.",
    siteName: "R.",
    images: [
      {
        url: "/web-app-manifest-192x192.png",
        width: 192,
        height: 192,
        alt: "R.",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "R.",
    description: "모든 것에 대하여 리뷰를 작성하고 공유할 수 있는 곳.",
    images: ["/web-app-manifest-192x192.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ece5" },
    { media: "(prefers-color-scheme: dark)", color: "surface-lowest" },
  ],
};

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${noto_sans_kr.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeInitializationScript()}
        </Script>
        <ThemeController />
        <TooltipProvider delayDuration={150}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <RootDocument>{children}</RootDocument>;
  }

  return (
    <ConvexAuthNextjsServerProvider>
      <RootDocument>{children}</RootDocument>
    </ConvexAuthNextjsServerProvider>
  );
}
